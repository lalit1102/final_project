import Module from "@/models/module.model";
import { IModule } from "@/types/module.types";
import { UpdateQuery } from "mongoose";

export class ModuleRepository {
  async create(data: Partial<IModule>): Promise<IModule> {
    return Module.create(data);
  }

  async findById(id: string): Promise<IModule | null> {
    return Module.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IModule>): Promise<IModule | null> {
    return Module.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IModule | null> {
    return Module.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Module.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Module.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IModule[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Module.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const moduleRepository = new ModuleRepository();
