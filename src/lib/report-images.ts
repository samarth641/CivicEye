import type { ReportType } from "@/types";

export interface ImageOption {
  id: string;
  label: string;
  url: string;
}

export interface RoadImageSet {
  id: string;
  label: string;
  issueUrl: string;
  beforeUrl: string;
  afterUrl: string;
}

/** Actual pothole / road damage photos */
const POTHOLE_ISSUE: ImageOption[] = [
  {
    id: "ph-1",
    label: "Deep asphalt pothole",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pothole.jpg/800px-Pothole.jpg",
  },
  {
    id: "ph-2",
    label: "Water-filled crater",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Pothole_in_Vancouver.jpg/800px-Pothole_in_Vancouver.jpg",
  },
  {
    id: "ph-3",
    label: "Road surface hole",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Pothole_on_road.jpg/800px-Pothole_on_road.jpg",
  },
];

const CRACK_ISSUE: ImageOption[] = [
  {
    id: "cr-1",
    label: "Alligator cracking",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Road_cracks.jpg/800px-Road_cracks.jpg",
  },
  {
    id: "cr-2",
    label: "Tar erosion",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop",
  },
  {
    id: "cr-3",
    label: "Subsidence damage",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop",
  },
];

const SPEED_ISSUE: ImageOption[] = [
  {
    id: "sb-1",
    label: "Unmarked speed hump",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop",
  },
  {
    id: "sb-2",
    label: "Faded rumble strip",
    url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
  },
];

const OTHER_ISSUE: ImageOption[] = [
  {
    id: "ot-1",
    label: "Open utility cover",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop",
  },
  {
    id: "ot-2",
    label: "Debris on carriageway",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
];

/** Road repair / resurfacing — distinct from damage photos */
export const ROAD_REPAIR_IMAGES: ImageOption[] = [
  {
    id: "rp-1",
    label: "Fresh asphalt lay",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop",
  },
  {
    id: "rp-2",
    label: "Paving crew at work",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop",
  },
  {
    id: "rp-3",
    label: "Road resurfacing",
    url: "https://images.unsplash.com/photo-1581092918055-0c4c3acd3789?w=800&auto=format&fit=crop",
  },
  {
    id: "rp-4",
    label: "Smooth repaired lane",
    url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop",
  },
];

function issuePool(type: ReportType): ImageOption[] {
  switch (type) {
    case "POTHOLE":
      return POTHOLE_ISSUE;
    case "ROAD_DAMAGE":
      return CRACK_ISSUE;
    case "SPEED_BREAKER":
      return SPEED_ISSUE;
    default:
      return OTHER_ISSUE;
  }
}

export function getIssueImages(type: ReportType): ImageOption[] {
  return issuePool(type);
}

export function getBeforeImages(type: ReportType): ImageOption[] {
  return issuePool(type);
}

export function getAfterImages(_type: ReportType): ImageOption[] {
  return ROAD_REPAIR_IMAGES;
}

/** @deprecated use getIssueImages — kept for demo seed */
export const ROAD_ISSUE_IMAGES: Record<
  ReportType,
  { label: string; url: string; beforeUrl: string; afterUrl: string }[]
> = {
  POTHOLE: POTHOLE_ISSUE.map((i, idx) => ({
    label: i.label,
    url: i.url,
    beforeUrl: i.url,
    afterUrl: ROAD_REPAIR_IMAGES[idx % ROAD_REPAIR_IMAGES.length].url,
  })),
  SPEED_BREAKER: SPEED_ISSUE.map((i, idx) => ({
    label: i.label,
    url: i.url,
    beforeUrl: i.url,
    afterUrl: ROAD_REPAIR_IMAGES[idx % ROAD_REPAIR_IMAGES.length].url,
  })),
  ROAD_DAMAGE: CRACK_ISSUE.map((i, idx) => ({
    label: i.label,
    url: i.url,
    beforeUrl: i.url,
    afterUrl: ROAD_REPAIR_IMAGES[idx % ROAD_REPAIR_IMAGES.length].url,
  })),
  OTHER: OTHER_ISSUE.map((i, idx) => ({
    label: i.label,
    url: i.url,
    beforeUrl: i.url,
    afterUrl: ROAD_REPAIR_IMAGES[idx % ROAD_REPAIR_IMAGES.length].url,
  })),
};

export const MISSING_PERSON_PHOTOS: ImageOption[] = [
  {
    id: "mp-ph-1",
    label: "Recent photo — adult male",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
  },
  {
    id: "mp-ph-2",
    label: "Recent photo — adult female",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop",
  },
  {
    id: "mp-ph-3",
    label: "Recent photo — child",
    url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&auto=format&fit=crop",
  },
  {
    id: "mp-ph-4",
    label: "CCTV still — public place",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop",
  },
  {
    id: "mp-ph-5",
    label: "Family-provided portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop",
  },
];

export function defaultRoadImages(type: ReportType): RoadImageSet {
  const issue = issuePool(type)[0];
  const repair = ROAD_REPAIR_IMAGES[0];
  return {
    id: `${type}-default`,
    label: issue.label,
    issueUrl: issue.url,
    beforeUrl: issue.url,
    afterUrl: repair.url,
  };
}

/** Back-compat alias */
export function defaultRoadImageUrls(type: ReportType) {
  const d = defaultRoadImages(type);
  return { url: d.issueUrl, beforeUrl: d.beforeUrl, afterUrl: d.afterUrl };
}
