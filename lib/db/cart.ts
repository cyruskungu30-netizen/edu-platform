import { createClient } from "@/lib/supabase/client";

export type CartResource = {
  id: string;
  title: string;
  slug: string;
  price: number;
  format: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  resource_id: string;
  quantity: number;
  resource: CartResource;
};

const supabase = createClient();

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
}

async function getOrCreateCart(userId: string) {
  const { data: existingCart, error: existingError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingCart) {
    return existingCart.id;
  }

  const { data: newCart, error: createError } = await supabase
    .from("carts")
    .insert({
      user_id: userId,
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  if (!newCart) {
    throw new Error("Unable to create cart.");
  }

  return newCart.id;
}

export async function getCartItems(): Promise<CartItem[]> {
  const userId = await getCurrentUserId();

  const cartId = await getOrCreateCart(userId);

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        cart_id,
        resource_id,
        quantity,
        resource:resources (
          id,
          title,
          slug,
          price,
          format
        )
      `,
    )
    .eq("cart_id", cartId)
    .order("id", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const resource = Array.isArray(item.resource)
      ? item.resource[0]
      : item.resource;

    return {
      id: item.id,
      cart_id: item.cart_id,
      resource_id: item.resource_id,
      quantity: item.quantity,
      resource: {
        id: resource?.id ?? item.resource_id,
        title: resource?.title ?? "Resource",
        slug: resource?.slug ?? "",
        price: Number(resource?.price ?? 0),
        format: resource?.format ?? "PDF",
      },
    };
  });
}

export async function addToCart(
  resourceId: string,
  quantity = 1,
) {
  const userId = await getCurrentUserId();

  const cartId = await getOrCreateCart(userId);

  const { data: existingItem, error: existingError } =
    await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("resource_id", resourceId)
      .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({
        quantity: newQuantity,
      })
      .eq("id", existingItem.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cartId,
      resource_id: resourceId,
      quantity,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({
      quantity,
    })
    .eq("id", cartItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearCart() {
  const userId = await getCurrentUserId();

  const cartId = await getOrCreateCart(userId);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId);

  if (error) {
    throw new Error(error.message);
  }
}