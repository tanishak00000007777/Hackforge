import TextInput from "@/components/studio/Inspector/controls/TextInput";
import NumberInput from "@/components/studio/Inspector/controls/NumberInput";
import ColorInput from "@/components/studio/Inspector/controls/ColorInput";
import SliderInput from "@/components/studio/Inspector/controls/SliderInput";
import SelectInput from "@/components/studio/Inspector/controls/SelectInput";
import AssetPicker from "@/components/studio/Inspector/controls/AssetPicker";

export const controlRegistry = {
  text: TextInput,
  number: NumberInput,
  color: ColorInput,
  slider: SliderInput,
  select: SelectInput,
  asset_picker: AssetPicker,
};
