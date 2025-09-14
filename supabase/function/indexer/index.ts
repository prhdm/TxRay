import {serve} from "https://deno.land/std@0.224.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {createPublicClient, decodeFunctionData, http} from "npm:viem@2";
import {safeTelegramAlert, TelegramBot} from "../_shared/telegram.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const RPC_URL = Deno.env.get("RPC_URL") ?? "https://rpc.hekla.taiko.xyz";
const CONTRACT = (Deno.env.get("CONTRACT") ?? "").toLowerCase();
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "*";

const ABI = [
    {
        type: "function",
        name: "mint",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "recipient",
                type: "address"
            },
            {
                name: "signature",
                type: "bytes"
            }
        ]
    },
    {
        type: "function",
        name: "upgradeTokenTo",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "_tokenId",
                type: "uint256"
            }
        ]
    }
];

const client = createPublicClient({
    transport: http(RPC_URL)
});
const CHUNK_BLOCKS = 4000n;
const MAX_TXS_PER_RUN = 3000;

const ok = (d, s = 200) => new Response(JSON.stringify(d), {
    status: s,
    headers: {
        "content-type": "application/json"
    }
});

const ALLOW_HEADERS = "content-type,authorization,apikey,x-client-info,prefer";

function corsHeaders(origin) {
    const allowOrigin = APP_ORIGIN === "*" ? "*" : origin === APP_ORIGIN ? APP_ORIGIN : "";
    const h = {
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": ALLOW_HEADERS,
        "vary": "Origin"
    };
    if (allowOrigin) h["access-control-allow-origin"] = allowOrigin;
    return h;
}

const okCors = (d, origin, s = 200) => new Response(JSON.stringify(d), {
    status: s,
    headers: {
        "content-type": "application/json",
        ...corsHeaders(origin)
    }
});
const cors = (origin) => new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
});

async function runIndexer(secret, headerSecret) {
    if (headerSecret !== CRON_SECRET && secret !== CRON_SECRET) {
        return ok({
            error: "forbidden"
        }, 403);
    }
    if (!CONTRACT) return ok({
        error: "Missing CONTRACT env"
    }, 500);
    const {data: cur, error: curErr} = await sb.from("index_cursor").select("*").eq("id", 1).single();
    if (curErr && curErr.code !== "PGRST116") return ok({
        error: curErr.message
    }, 500);
    let last = BigInt(cur?.last_block_number ?? 0);
    const head = await client.getBlockNumber();
    if (head <= last) {
        await sb.from("index_cursor").upsert({
            id: 1,
            last_block_number: Number(head),
            last_run_at: new Date().toISOString()
        });
        return ok({
            ok: true,
            inserted: 0,
            last_block_number: head.toString(),
            head_block_number: head.toString()
        });
    }
    let processedTo = last;
    let inserted = 0;
    try {
        for (let from = last + 1n; from <= head; from += CHUNK_BLOCKS) {
            const to = from + CHUNK_BLOCKS - 1n <= head ? from + CHUNK_BLOCKS - 1n : head;
            const logs = await client.getLogs({
                address: CONTRACT,
                fromBlock: from,
                toBlock: to
            });
            const txHashes = [
                ...new Set(logs.map((l) => l.transactionHash))
            ];
            if (!txHashes.length) {
                processedTo = to;
                continue;
            }
            const rows = [];
            for (const h of txHashes) {
                if (inserted >= MAX_TXS_PER_RUN) break;
                const [tx, rcpt] = await Promise.all([
                    client.getTransaction({
                        hash: h
                    }),
                    client.getTransactionReceipt({
                        hash: h
                    })
                ]);
                const toAddr = (tx.to ?? "").toLowerCase();
                if (toAddr !== CONTRACT) continue;
                const blk = await client.getBlock({
                    blockHash: rcpt.blockHash
                });
                let method = "unknown";
                try {
                    const decoded = decodeFunctionData({
                        abi: ABI,
                        data: tx.input
                    });
                    method = decoded.functionName;
                } catch (e) {
                    const input = tx.input.toLowerCase();
                    if (input.startsWith("0x40c10f19")) {
                        method = "mint";
                    } else if (input.startsWith("0x")) {
                        method = "unknown_contract_call";
                    } else {
                        method = "transfer";
                    }
                }
                rows.push({
                    tx_hash: h,
                    block_number: Number(tx.blockNumber),
                    block_timestamp: new Date(Number(blk.timestamp) * 1000),
                    from_address: tx.from,
                    to_address: tx.to,
                    value_wei: (tx.value ?? 0n).toString(),
                    gas_used: rcpt.gasUsed?.toString() ?? "0",
                    effective_gas_price_wei: rcpt.effectiveGasPrice?.toString() ?? "0",
                    method,
                    status: rcpt.status === "success"
                });
                inserted++;
            }
            if (rows.length) {
                const {error: upErr} = await sb.from("transactions").upsert(rows, {
                    onConflict: "tx_hash"
                });
                if (upErr) return ok({
                    error: upErr.message
                }, 500);
            }
            processedTo = to;
            if (inserted >= MAX_TXS_PER_RUN) break;
        }
        const {error: curUpErr} = await sb.from("index_cursor").upsert({
            id: 1,
            last_block_number: Number(processedTo),
            last_run_at: new Date().toISOString()
        });
        if (curUpErr) return ok({
            error: curUpErr.message
        }, 500);
        // Send Telegram alert for successful indexer update
        if (inserted > 0) {
            try {
                const telegramBot = new TelegramBot();
                await telegramBot.sendIndexerUpdateAlert(
                    Number(last),
                    Number(processedTo),
                    inserted
                );
            } catch (error) {
                console.error("Failed to send indexer update Telegram alert:", error);
                // Don't fail the indexer if Telegram fails
            }
        }

        return ok({
            ok: true,
            inserted,
            last_block_number: processedTo.toString(),
            head_block_number: head.toString()
        });
    } catch (e) {
        // Send error alert to Telegram
        try {
            await safeTelegramAlert(`
🚨 <b>Indexer Error</b>

❌ <b>Error:</b> <code>${String(e?.message ?? e)}</code>
📍 <b>Context:</b> Indexer run failed
📊 <b>Last Block:</b> ${last.toString()}
📊 <b>Head Block:</b> ${head?.toString() || 'Unknown'}
⏰ <b>Time:</b> ${new Date().toISOString()}
            `);
        } catch (telegramError) {
            console.error("Failed to send error alert to Telegram:", telegramError);
        }

        return ok({
            error: String(e?.message ?? e)
        }, 500);
    }
}

async function getSummary(origin, walletAddress = null) {
    let query = sb.from("kpi_summary");

    if (walletAddress) {
        const {data, error} = await sb.rpc("kpi_summary_wallet", {
            wallet_addr: walletAddress.toLowerCase()
        });
        if (error) return okCors({
            error: error.message
        }, origin, 500);
        return okCors(data, origin);
    } else {
        const {data, error} = await query.select("*").single();
        if (error) return okCors({
            error: error.message
        }, origin, 500);
        return okCors(data, origin);
    }
}

async function getTimeseries(url, origin, walletAddress = null) {
    const gran = url.searchParams.get("granularity") ?? "day";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (walletAddress) {
        const {data, error} = await sb.rpc("kpi_timeseries_wallet_text", {
            granularity: gran,
            start_at: from ? new Date(from).toISOString() : null,
            end_at: to ? new Date(to).toISOString() : null,
            wallet_addr: walletAddress.toLowerCase()
        });
        if (error) return okCors({
            error: error.message
        }, origin, 500);
        return okCors(data, origin);
    } else {
        const {data, error} = await sb.rpc("kpi_timeseries_text", {
            granularity: gran,
            start_at: from ? new Date(from).toISOString() : null,
            end_at: to ? new Date(to).toISOString() : null
        });
        if (error) return okCors({
            error: error.message
        }, origin, 500);
        return okCors(data, origin);
    }
}

async function getTxs(url, origin, walletAddress = null) {
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

    let query = sb.from("transactions").select("tx_hash,block_number,block_timestamp,from_address,to_address,value_wei,gas_used,effective_gas_price_wei,gas_cost_wei,method,status");

    if (walletAddress) {
        query = query.eq("from_address", walletAddress.toLowerCase());
    }

    const {data, error} = await query.order("block_number", {
        ascending: false
    }).range(offset, offset + limit - 1);

    if (error) return okCors({
        error: error.message
    }, origin, 500);
    return okCors(data, origin);
}

async function getHealth(origin) {
    const {data} = await sb.from("index_cursor").select("*").eq("id", 1).single();
    return okCors({
        index_cursor: data ?? null
    }, origin);
}

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");
    const origin = req.headers.get("origin");
    if (req.method === "OPTIONS") {
        if (path.endsWith("/summary") || path.endsWith("/timeseries") || path.endsWith("/txs") || path.endsWith("/health") || path.endsWith("/all")) {
            return cors(origin);
        }
        return new Response(null, {
            status: 204
        });
    }
    try {
        if (req.method === "POST" && path.endsWith("/index")) {
            return runIndexer(url.searchParams.get("secret"), req.headers.get("x-cron-secret"));
        }
        const walletAddress = url.searchParams.get("wallet") || req.headers.get("x-wallet-address");

        if (req.method === "GET" && path.endsWith("/summary")) {
            return getSummary(origin, walletAddress);
        }
        if (req.method === "GET" && path.endsWith("/timeseries")) {
            return getTimeseries(url, origin, walletAddress);
        }
        if (req.method === "GET" && path.endsWith("/txs")) {
            return getTxs(url, origin, walletAddress);
        }
        if (req.method === "GET" && path.endsWith("/all")) {
            return getSummary(origin, null);
        }
        if (req.method === "GET" && path.endsWith("/health")) {
            return getHealth(origin);
        }
        return ok({
            routes: [
                "POST /index",
                "GET /summary?wallet=<address>",
                "GET /timeseries?wallet=<address>",
                "GET /txs?wallet=<address>",
                "GET /all",
                "GET /health"
            ]
        }, 404);
    } catch (e) {
        // Send error alert to Telegram for server errors
        try {
            await safeTelegramAlert(`
🚨 <b>Indexer Server Error</b>

❌ <b>Error:</b> <code>${String(e?.message ?? e)}</code>
📍 <b>Path:</b> ${path}
🌐 <b>Method:</b> ${req.method}
⏰ <b>Time:</b> ${new Date().toISOString()}
            `);
        } catch (telegramError) {
            console.error("Failed to send server error alert to Telegram:", telegramError);
        }

        if (path.endsWith("/summary") || path.endsWith("/timeseries") || path.endsWith("/txs") || path.endsWith("/health") || path.endsWith("/all")) {
            return okCors({
                error: String(e?.message ?? e)
            }, origin, 500);
        }
        return ok({
            error: String(e?.message ?? e)
        }, 500);
    }
});
