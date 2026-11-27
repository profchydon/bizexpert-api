import { BusinessRole, LocationType } from "../common/enums";
import { PrismaService } from "../prisma/prisma.service";
import { nextBusinessSlug, slugifyBusinessName } from "./business-slug";
import { CreateBusinessDto } from "./dto/create-business.dto";

function optionalText(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createBusinessWithOwner(
  prisma: PrismaService,
  userId: string,
  dto: CreateBusinessDto,
) {
  const base = slugifyBusinessName(dto.name);
  return prisma.$transaction(async (tx) => {
    const taken = await tx.business.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const existing = new Set(
      taken
        .map((row) => row.slug)
        .filter((slug): slug is string => Boolean(slug)),
    );
    const business = await tx.business.create({
      data: {
        name: dto.name.trim(),
        slug: nextBusinessSlug(base, existing),
        description: optionalText(dto.description),
        phone: optionalText(dto.phone),
        email: optionalText(dto.email)?.toLowerCase() ?? null,
        address: optionalText(dto.address),
      },
    });
    await tx.businessMembership.create({
      data: {
        businessId: business.id,
        userId,
        role: BusinessRole.OWNER,
      },
    });
    await tx.location.create({
      data: {
        businessId: business.id,
        name: "Main Location",
        type: LocationType.SHOP,
        isDefault: true,
      },
    });
    return tx.business.findUniqueOrThrow({
      where: { id: business.id },
      include: { locations: true },
    });
  });
}
