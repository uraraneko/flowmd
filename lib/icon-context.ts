import {
  type InjectionKey,
  inject,
  type Component,
  type SVGAttributes,
} from "vue";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons.js";

export type IconComponent = Component<SVGAttributes & { size?: number }>;

export interface IconMap {
  CheckIcon: IconComponent;
  CopyIcon: IconComponent;
  DownloadIcon: IconComponent;
  ExternalLinkIcon: IconComponent;
  Loader2Icon: IconComponent;
  Maximize2Icon: IconComponent;
  RotateCcwIcon: IconComponent;
  XIcon: IconComponent;
  ZoomInIcon: IconComponent;
  ZoomOutIcon: IconComponent;
}

export const defaultIcons: IconMap = {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
};

export const IconKey: InjectionKey<IconMap> = Symbol("Icon");

export const useIcons = () => inject(IconKey, defaultIcons);
