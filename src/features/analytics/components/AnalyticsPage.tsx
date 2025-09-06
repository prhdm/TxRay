"use client";

import { 
  CollectionHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui";

export default function AnalyticsPage() {
  const analyticsData = [
    {
      title: "Total Cards",
      value: "24",
      description: "Cards in your collection"
    },
    {
      title: "Rarity Score",
      value: "1,250",
      description: "Average rarity multiplier"
    },
    {
      title: "Upgrades",
      value: "8",
      description: "Cards upgraded this month"
    },
    {
      title: "Power Level",
      value: "170x",
      description: "Maximum power-up achieved"
    }
  ];

  return (
    <main className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* Collection Header */}
      <CollectionHeader
        title="Analytics Dashboard"
        description="Track your collection performance, rarity scores, and upgrade statistics. Monitor your progress towards achieving maximum power-up levels."
      />

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.map((item, index) => (
          <Card key={index} className="p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {item.value}
              </div>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Analytics Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Rarity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Common</span>
                <span className="text-sm font-medium">12 cards</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rare</span>
                <span className="text-sm font-medium">8 cards</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Epic</span>
                <span className="text-sm font-medium">4 cards</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '17%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Upgraded Email Marketing card</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Minted new Content Creation card</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Achieved 170x power-up</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
