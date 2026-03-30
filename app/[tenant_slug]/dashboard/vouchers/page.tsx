"use client";

import { Ticket } from "lucide-react";
import { VOUCHER_DATA } from "@/mock-data/vouchers";

// Components - Using enhanced base components
import { KpiCard } from "@/components/charts/kpi-card";
import { LineGraph } from "@/components/charts/line-graph";
import { BarList } from "@/components/charts/bar-list";
import { PieChart } from "@/components/charts/pie-chart";
import { VoucherRulesTable } from "@/components/tables/voucher-rules-table";
import { Header } from "@/components/ui/header";

export default function VouchersPage() {
  return (
     <div className="w-full max-w-[1400px] mx-auto">
        <div className="px-8 pt-10 pb-2">
            <Header 
                title="Discounts & Vouchers" 
                subtitle="Executive overview of voucher performance and discount eligibility rules."
            />
        </div>
        <div className="px-8 pb-8 pt-6 space-y-8">

            {/* Row 1: Metrics & Revenue Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Active Vouchers Card - Using KpiCard with vertical variant */}
                 <div className="col-span-1 lg:col-span-4">
                    <KpiCard 
                        title={VOUCHER_DATA.activeVouchers.title}
                        value={VOUCHER_DATA.activeVouchers.value}
                        icon={Ticket}
                        trend={{
                            value: parseFloat(VOUCHER_DATA.activeVouchers.change.replace('+', '')),
                            label: "vs last month",
                            direction: "up"
                        }}
                        iconColorClass="text-primary"
                        iconBgClass="bg-primary/10"
                        progress={{
                            label: "Utilization Rate",
                            value: VOUCHER_DATA.activeVouchers.utilizationRate,
                            color: "bg-teal-500"
                        }}
                        variant="vertical"
                    />
                 </div>
                 
                 {/* Revenue Impact Chart - Using LineGraph with multi-series */}
                 <div className="col-span-1 lg:col-span-8">
                    <LineGraph 
                        title={VOUCHER_DATA.revenueImpact.title}
                        description={VOUCHER_DATA.revenueImpact.description}
                        xAxisData={VOUCHER_DATA.revenueImpact.data.xAxis}
                        series={[
                            {
                                name: "Gross Revenue",
                                data: VOUCHER_DATA.revenueImpact.data.gross,
                                color: "#3f68e4"
                            },
                            {
                                name: "Net Revenue",
                                data: VOUCHER_DATA.revenueImpact.data.net,
                                color: "#0d9488"
                            }
                        ]}
                        tooltipFormatter={(value) => `₱${value.toLocaleString()}`}
                        customLegend={true}
                        legendItems={[
                            { name: "Gross Revenue", color: "#3f68e4" },
                            { name: "Net Revenue", color: "#0d9488" }
                        ]}
                        height="200px"
                    />
                 </div>
            </div>

            {/* Row 2: Top Vouchers & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Top Vouchers - Using BarList with large bars */}
                 <BarList 
                    title="Top Vouchers by Usage" 
                    description="Top performing campaigns this month"
                    items={VOUCHER_DATA.topVouchers.map(v => ({
                        name: v.name,
                        value: v.usages,
                        percentage: v.capacity,
                        color: v.color,
                        textColor: "text-white"
                    }))}
                    barHeight="lg"
                 />
                 
                 {/* Discount Distribution - Using PieChart with donut variant */}
                 <div className="bg-card p-6 rounded-xl shadow-sm flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold">Discount Type Distribution</h3>
                            <p className="text-xs text-muted-foreground">Passenger segment utilization</p>
                        </div>
                    </div>
                    <PieChart 
                        data={VOUCHER_DATA.discountDistribution}
                        variant="donut"
                        radius={["60%", "75%"]}
                        centerLabel={{ value: "100%", subtitle: "Total Dis." }}
                        customLegend={true}
                        showLegend={false}
                        showCard={false}
                        height="176px"
                    />
                 </div>
            </div>

            {/* Row 3: Rules Table */}
            {/* <VoucherRulesTable items={VOUCHER_DATA.rules} /> */}
        </div>
        </div>
  );
}

