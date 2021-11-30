export interface CachedPatch {
  retrievedAt: number;
  data: PatchData;
}

export interface Patch {
  patch_number: string;
  patch_name: string;
  patch_timestamp: number;
}

export interface PatchData {
  patches: Patch[];
}

export interface GenericPatchItem {
  indent_level: number;
  note: string;
}

export interface ItemAbilityNote extends GenericPatchItem {}

export interface Item {
  ability_id: number;
  ability_notes: ItemAbilityNote[];
  postfix_lines?: number;
}

export interface HeroAbility {
  ability_id: number;
  ability_notes?: Record<number, string>;
}

export interface Hero {
  hero_id: number;
  abilities?: HeroAbility;
}

export interface PatchInfo extends Patch {
  generic: GenericPatchItem[];
  heroes: Hero[];
  items: Item[];
  success: boolean;
}
