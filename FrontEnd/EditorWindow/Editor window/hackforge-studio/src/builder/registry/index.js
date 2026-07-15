import { heroSection } from "../sections/hero";
import { tracksSection } from "../sections/tracks";
import { timelineSection } from "../sections/timeline";
import { aboutSection } from "../sections/about";
import { sponsorsSection } from "../sections/sponsors";
import { judgesSection } from "../sections/judges";
import { faqSection } from "../sections/faq";
import { footerSection } from "../sections/footer";
import { formEmbedSection } from "../sections/formEmbed";

import { headingElement } from "@/components/studio/elements/Heading";
import { paragraphElement } from "@/components/studio/elements/Paragraph";
import { buttonElement } from "@/components/studio/elements/Button";
import { imageElement } from "@/components/studio/elements/Image";
import { containerElement } from "@/components/studio/elements/Container";
import { rowElement } from "@/components/studio/elements/Row";
import { columnElement } from "@/components/studio/elements/Column";
import { gridElement } from "@/components/studio/elements/Grid";
import { dividerElement } from "@/components/studio/elements/Divider";
import { badgeElement } from "@/components/studio/elements/Badge";
import { cardElement } from "@/components/studio/elements/Card";
import { videoElement } from "@/components/studio/elements/Video";
import { countdownElement } from "@/components/studio/elements/Countdown";
import { accordionElement } from "@/components/studio/elements/Accordion";
import { tabsElement } from "@/components/studio/elements/Tabs";
import { inputElement } from "@/components/studio/elements/Input";
import { textareaElement } from "@/components/studio/elements/Textarea";
import { mapElement } from "@/components/studio/elements/Map";

export const componentRegistry = {
  [heroSection.type]: heroSection,
  [tracksSection.type]: tracksSection,
  [timelineSection.type]: timelineSection,
  [aboutSection.type]: aboutSection,
  [sponsorsSection.type]: sponsorsSection,
  [judgesSection.type]: judgesSection,
  [faqSection.type]: faqSection,
  [footerSection.type]: footerSection,
  [formEmbedSection.type]: formEmbedSection,
};

export const elementRegistry = {
  [headingElement.type]: headingElement,
  [paragraphElement.type]: paragraphElement,
  [buttonElement.type]: buttonElement,
  [imageElement.type]: imageElement,
  [containerElement.type]: containerElement,
  [rowElement.type]: rowElement,
  [columnElement.type]: columnElement,
  [gridElement.type]: gridElement,
  [dividerElement.type]: dividerElement,
  [badgeElement.type]: badgeElement,
  [cardElement.type]: cardElement,
  [videoElement.type]: videoElement,
  [countdownElement.type]: countdownElement,
  [accordionElement.type]: accordionElement,
  [tabsElement.type]: tabsElement,
  [inputElement.type]: inputElement,
  [textareaElement.type]: textareaElement,
  [mapElement.type]: mapElement,
};

export const schemaRegistry = {
  ...componentRegistry
};

export { controlRegistry } from "./controls";
export { catalogueMetadata } from "./catalogue";
