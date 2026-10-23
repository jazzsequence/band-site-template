import { TextLink } from "@/lib/btn";
import "./announcement.css";

export interface AnnouncementProps {
  text: string;
  linkLabel: string;
  linkHref?: string;
  linkTarget?: "_self" | "_blank";
  tone: "accent" | "yellow" | "dark" | "gradient";
  align: "center" | "left";
}

export function AnnouncementRender({ text, linkLabel, linkHref, linkTarget, tone, align }: AnnouncementProps) {
  return (
    <div className="p1-announcement" data-tone={tone} data-align={align}>
      <span className="p1-announcement__text">{text}</span>
      {linkLabel && (
        <TextLink className="p1-announcement__link" href={linkHref} target={linkTarget}>
          {linkLabel}
        </TextLink>
      )}
    </div>
  );
}
