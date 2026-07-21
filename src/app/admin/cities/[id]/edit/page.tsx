"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CityForm from "../../city-form";
import { Loading } from "@/components/ui/loading";

export default function EditCityPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/cities/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <Loading className="py-20" />;

  return <CityForm initialData={data as never} cityId={id} />;
}
