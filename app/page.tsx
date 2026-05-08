import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        shadcn/ui — base
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="lg">Ouvrir le dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titre du dialog</DialogTitle>
            <DialogDescription>
              Composant Radix Dialog stylé avec Tailwind v4 + tokens shadcn.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Le contenu du dialog peut contenir n&apos;importe quoi : un
            formulaire, une confirmation, etc.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Confirmer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
