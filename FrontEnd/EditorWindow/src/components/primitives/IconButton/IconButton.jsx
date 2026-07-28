import styles from "./IconButton.module.css";
import {
  ICON_BUTTON_SIZES,
  ICON_BUTTON_VARIANTS,
} from "./IconButtonTypes";
import { cn } from "@/lib/cn";

/**
 * Universal Icon Button
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {"default"|"active"|"ghost"} [props.variant]
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {boolean} [props.disabled]
 * @param {Function} [props.onClick]
 */
export default function IconButton({
  icon,
  title,
  variant = ICON_BUTTON_VARIANTS.DEFAULT,
  size = ICON_BUTTON_SIZES.MD,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        styles.root,
        styles[size],
        styles[variant]
      )}
    >
      {icon}
    </button>
  );
}