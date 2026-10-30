import { useEffect, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import type { Festival } from "@/types/festival";

// One request per page load, shared by every island on the page.
const requests = new Map<string, Promise<Festival[]>>();

function loadFestivals(url: string): Promise<Festival[]> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`festival data: HTTP ${res.status}`);
      return res.json() as Promise<Festival[]>;
    });
    // A failed request must not stick: Retry has to be able to ask again.
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request;
}

/** Wraps a page component that needs the dataset: it gets a URL prop instead of the data. */
export function withFestivalData(Component: ComponentType<{ festivals: Festival[] }>) {
  return function FestivalDataIsland({ dataUrl }: { dataUrl: string }) {
    const [festivals, setFestivals] = useState<Festival[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
      let active = true;
      setFailed(false);
      loadFestivals(dataUrl).then(
        (data) => active && setFestivals(data),
        (error) => {
          console.error(error);
          if (active) setFailed(true);
        },
      );
      return () => {
        active = false;
      };
    }, [dataUrl, attempt]);

    if (festivals) return <Component festivals={festivals} />;
    return (
      <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        {failed ? (
          <>
            <p>Could not load the festivals. Check your connection.</p>
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
          </>
        ) : (
          <p>Loading festivals…</p>
        )}
      </div>
    );
  };
}
