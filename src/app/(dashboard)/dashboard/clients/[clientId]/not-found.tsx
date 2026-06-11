import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ClientNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold">Клиентът не е намерен</h1>
      <p className="mt-3 text-sm leading-6 text-[#69655e]">
        Този клиент не съществува или нямаш достъп до него.
      </p>
      <Button asChild className="mt-6 bg-[#16372f] text-white hover:bg-[#214b42]">
        <Link href="/dashboard/clients">Обратно към клиентите</Link>
      </Button>
    </div>
  );
}
