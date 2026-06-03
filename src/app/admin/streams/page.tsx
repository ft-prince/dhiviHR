import { desc, eq, ilike, or, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { streams, colleges, formTemplates } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StreamsTable } from "@/components/admin/streams-table";
import { StreamCreateForm } from "@/components/admin/stream-create-form";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminStreamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const filters = [];
  if (q) filters.push(or(ilike(streams.name, `%${q}%`))!);
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [list, [{ total }], collegeList, templateList] = await Promise.all([
    db
      .select({
        id: streams.id,
        name: streams.name,
        slug: streams.slug,
        collegeId: streams.collegeId,
        collegeName: colleges.name,
        templateId: streams.templateId,
        templateName: formTemplates.name,
        createdAt: streams.createdAt,
        updatedAt: streams.updatedAt,
      })
      .from(streams)
      .leftJoin(colleges, eq(streams.collegeId, colleges.id))
      .leftJoin(formTemplates, eq(streams.templateId, formTemplates.id))
      .where(where)
      .orderBy(desc(streams.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(streams).where(where),
    db.select({ id: colleges.id, name: colleges.name }).from(colleges).orderBy(colleges.name),
    db.select({ id: formTemplates.id, name: formTemplates.name }).from(formTemplates).orderBy(formTemplates.name),
  ]);

  return (
    <>
      <PageHeader title="Streams" description="Streams per college. Global streams (no college) are available to public signups." />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <StreamsTable
            streams={list}
            filters={{ q }}
          />
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Add Stream</h2>
          <p className="mt-1 text-xs text-ink-soft">Optionally assign to a college and template.</p>
          <StreamCreateForm colleges={collegeList} templates={templateList} />
        </div>
      </div>
    </>
  );
}
