import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Resource = {
  id: string;
  title: string;
  status: string | null;
  price: number | null;
  created_at: string | null;
};

type Order = {
  id: string;
  resource_id: string | null;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must sign in to access analytics." },
        { status: 401 },
      );
    }

    const { data: resourceData, error: resourceError } = await supabase
      .from("resources")
      .select("id, title, status, price, created_at")
      .or(
        `educator_id.eq.${user.id},user_id.eq.${user.id},seller_id.eq.${user.id}`,
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (resourceError) {
      console.error("Analytics resources query failed:", resourceError.message);

      return NextResponse.json(
        { error: "Unable to retrieve your resources." },
        { status: 500 },
      );
    }

    const resources = (resourceData ?? []) as Resource[];
    const resourceIds = resources.map((resource) => resource.id);

    let orders: Order[] = [];

    if (resourceIds.length > 0) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, resource_id, status, total_amount, created_at")
        .in("resource_id", resourceIds)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (orderError) {
        console.error("Analytics orders query failed:", orderError.message);

        return NextResponse.json(
          { error: "Unable to retrieve sales analytics." },
          { status: 500 },
        );
      }

      orders = (orderData ?? []) as Order[];
    }

    const completedOrders = orders.filter((order) =>
      ["completed", "paid", "success"].includes(
        (order.status ?? "").toLowerCase(),
      ),
    );

    const totalRevenue = completedOrders.reduce(
      (total, order) => total + Number(order.total_amount ?? 0),
      0,
    );

    const publishedResources = resources.filter(
      (resource) => resource.status === "published",
    ).length;

    const pendingResources = resources.filter(
      (resource) => resource.status === "pending",
    ).length;

    const resourceSales = new Map<string, number>();

    for (const order of completedOrders) {
      if (order.resource_id) {
        resourceSales.set(
          order.resource_id,
          (resourceSales.get(order.resource_id) ?? 0) + 1,
        );
      }
    }

    const topResources = resources
      .map((resource) => ({
        id: resource.id,
        title: resource.title,
        status: resource.status,
        price: Number(resource.price ?? 0),
        sales: resourceSales.get(resource.id) ?? 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 20);

    const summary = {
      totalResources: resources.length,
      publishedResources,
      pendingResources,
      otherResources:
        resources.length - publishedResources - pendingResources,
      completedSales: completedOrders.length,
      totalRevenue,
      averageOrderValue:
        completedOrders.length > 0
          ? totalRevenue / completedOrders.length
          : 0,
    };

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "csv") {
      const rows = [
        ["Resource ID", "Title", "Status", "Price", "Completed Sales"],
        ...topResources.map((resource) => [
          resource.id,
          resource.title,
          resource.status ?? "",
          String(resource.price),
          String(resource.sales),
        ]),
      ];

      const csv = rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\r\n");

      return new Response(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="edumarket-analytics.csv"',
          "Cache-Control": "private, no-store",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        summary,
        topResources,
        recentOrders: completedOrders.slice(0, 20),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Teacher analytics API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while loading analytics." },
      { status: 500 },
    );
  }
}