"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AttractionForm from "../../attraction-form";
import { Loading } from "@/components/ui/loading";

export default function EditAttractionPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/attractions/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <Loading className="py-20" />;

  return <AttractionForm initialData={data as never} attractionId={id} />;
}
