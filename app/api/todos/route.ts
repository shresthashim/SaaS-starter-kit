import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 5;

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId,
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (page - 1),
    });

    const totalItems = await prisma.todo.count({
      where: {
        userId,
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return NextResponse.json({ todos, currentPage: page, totalPages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      todos: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.isSubscribed && user.todos.length >= 3) {
    return NextResponse.json(
      { error: "Upgrade to premium to create more than 3 todos" },
      { status: 403 }
    );
  }

  const { title } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        title,
        userId,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
