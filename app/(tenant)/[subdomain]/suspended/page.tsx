import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenantBySubdomain } from "@/lib/tenants/repo";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ subdomain: string }>;
};

export default async function SuspendedPage({ params }: Props) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  const message =
    tenant?.suspension_message ??
    `L'espace ${tenant?.name ?? subdomain} est temporairement suspendu.`;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Espace temporairement suspendu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{message}</p>
          <p className="text-xs text-muted-foreground">
            Contact support :{" "}
            <a
              className="underline hover:text-foreground"
              href={`mailto:${env.supportEmail}`}
            >
              {env.supportEmail}
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
