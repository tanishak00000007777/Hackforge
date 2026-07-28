import styles from "./Button.module.css";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "./ButtonTypes";
import { cn } from "@/lib/cn";

/**
 * Universal Button Component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {"primary"|"secondary"|"outline"|"ghost"} [props.variant]
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {boolean} [props.disabled]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {Function} [props.onClick]
 * @param {string} [props.type]
 */
export default function Button({

children,

variant=BUTTON_VARIANTS.PRIMARY,

size=BUTTON_SIZES.MD,

disabled=false,

leftIcon,

rightIcon,

type="button",

onClick,

}){

return(

<button

type={type}

disabled={disabled}

onClick={onClick}

className={cn(

styles.button,

styles[size],

styles[variant]

)}

>

{leftIcon}

<span>

{children}

</span>

{rightIcon}

</button>

);

}