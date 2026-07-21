"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SpotForm from "../../spot-form";
import { Loading } from "@/components/ui/loading";

export default function EditSpotPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/spots/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <Loading className="py-20" />;

  return <SpotForm initialData={data as never} spotId={id} />;
}
