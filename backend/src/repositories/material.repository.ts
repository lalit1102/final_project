import Material from "@/models/material.model";
import { IMaterial } from "@/types/material.types";
import { UpdateQuery } from "mongoose";

export class MaterialRepository {
  async create(data: Partial<IMaterial>): Promise<IMaterial> {
    return Material.create(data);
  }

  async findById(id: string): Promise<IMaterial | null> {
    return Material.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IMaterial>): Promise<IMaterial | null> {
    return Material.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IMaterial | null> {
    return Material.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Material.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Material.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IMaterial[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Material.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const materialRepository = new MaterialRepository();
