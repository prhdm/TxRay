import * as React from "react"
import {cn} from "@/components/ui/lib/utils"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "./dialog"
import {Button} from "./button"

export interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    userAddress?: string
    userName?: string
    onProfileClick?: () => void
    onLogout?: () => void
    isOpen?: boolean
    onToggle?: () => void
}

const ProfileDropdown = React.forwardRef<HTMLDivElement, ProfileDropdownProps>(
    ({
         className,
         userAddress,
         userName,
         onProfileClick,
         onLogout,
         isOpen = false,
         onToggle,
         ...props
     }, ref) => {
        const displayName = userName || (userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'User');
        const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

        const handleLogoutClick = () => {
            setShowLogoutDialog(true);
            onToggle?.(); // Close dropdown when showing dialog
        };

        const handleLogoutConfirm = async () => {
            setShowLogoutDialog(false);
            if (onLogout) {
                await onLogout();
            }
        };

        const handleLogoutCancel = () => {
            setShowLogoutDialog(false);
        };

        return (
            <div ref={ref} className={cn("relative", className)} {...props}>
                {/* Profile Button */}
                <button
                    onClick={onToggle}
                    className="relative px-4 py-2 border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group"
                >
                    {/* Fill Animation Background */}
                    <div
                        className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>

                    {/* Button Content */}
                    <div className="relative z-10 flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
                        </div>
                        <span className="text-sm font-medium">{displayName}</span>
                        <svg
                            className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div
                        className="absolute right-0 mt-2 w-48 bg-background border border-foreground rounded-md shadow-lg z-50">
                        <div className="py-1">
                            {/* Profile Option */}
                            <button
                                onClick={onProfileClick}
                                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors duration-200 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <span>Profile</span>
                            </button>

                            {/* Divider */}
                            <div className="border-t border-muted my-1"></div>

                            {/* Logout Option */}
                            <button
                                onClick={handleLogoutClick}
                                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors duration-200 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Logout Confirmation Dialog */}
                <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Confirm Logout</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to logout? You will need to reconnect your wallet to access your
                                account again.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={handleLogoutCancel}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleLogoutConfirm}
                                className="flex-1"
                            >
                                Logout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }
)
ProfileDropdown.displayName = "ProfileDropdown"

export {ProfileDropdown}
