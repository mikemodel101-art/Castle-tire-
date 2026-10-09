import { CustomerSearch, type CustomerRow } from "@/components/customer-search";
import { PageHeader } from "@/components/ui";
import { CUSTOMERS } from "@/lib/data";
import { jobsOfCustomer, vehiclesOf } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  const rows: CustomerRow[] = CUSTOMERS.map((customer) => {
    const jobs = jobsOfCustomer(customer.id);
    return {
      customer,
      vehicles: vehiclesOf(customer.id),
      visits: jobs.length,
      lastVisit: jobs[0]?.date ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer & vehicle history"
        title="Customers"
        subtitle="Search by name, phone number or license plate to open a vehicle's full history."
      />
      <CustomerSearch rows={rows} />
    </div>
  );
}
