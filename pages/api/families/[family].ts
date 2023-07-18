import { superTokensNextWrapper } from "supertokens-node/nextjs";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import supertokens from "supertokens-node";
import { backendConfig } from "@/config/backendConfig";
import { NextApiRequest, NextApiResponse } from "next";
import { SessionRequest } from "supertokens-node/framework/express";
import { Response } from "express";
import { prisma } from "@/db/prisma";
import { Prisma } from "@prisma/client";
import { FullFamily } from "@/types/prismaHelperTypes";

supertokens.init(backendConfig());

export interface IFamily {
  family?: Prisma.FamilyGetPayload<{
    include: { caregivers: true; children: true };
  }>;
  error?:
    | "INTERNAL_SERVER_ERROR"
    | "METHOD_NOT_ALLOWED"
    | "NOT_FOUND"
    | "FORBIDDEN";
}

export default async function families(
  req: NextApiRequest & SessionRequest,
  res: NextApiResponse & Response
) {
  await superTokensNextWrapper(
    async (next) => {
      return await verifySession()(req, res, next);
    },
    req,
    res
  );

  let session = req.session;
  const user = await prisma.user
    .findUnique({
      where: { authId: session.getUserId() },
    })
    .catch((err) => console.log(err));

  if (!user) return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });

  const { family: familyId } = req.query;

  let family: FullFamily;

  try {
    family = await prisma.family.findUniqueOrThrow({
      where: { id: familyId as string },
      include: { caregivers: true, children: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    )
      return res.status(404).json({ error: "NOT_FOUND" });

    console.error(err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }

  switch (req.method) {
    case "GET":
      return res.status(200).json({ family });
    case "POST":
      const familyUpdate = req.body as Prisma.FamilyUpdateInput;

      if (user.role.includes("USER")) {
        if (family.userId !== user.id)
          return res.status(403).json({ error: "FORBIDDEN" });
      }

      const newFamily = await prisma.family
        .update({ where: { id: familyId as string }, data: familyUpdate })
        .catch((err) => console.log(err));

      if (!newFamily)
        return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
      else return res.status(200).json({ family: newFamily });

    case "DELETE":
      if (user.role.includes("USER")) {
        if (family.userId !== user.id)
          return res.status(403).json({ error: "FORBIDDEN" });
      }

      const deletedFamily = await prisma.family
        .delete({ where: { id: familyId as string } })
        .catch((err) => console.log(err));

      return res.status(200).json({ family: deletedFamily });

    default:
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
}
