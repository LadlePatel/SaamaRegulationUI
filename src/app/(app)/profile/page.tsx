import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the profile page. User details and settings will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
