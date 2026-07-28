import { elementRegistry } from "@/builder/registry";

export default function ElementRenderer({

    element,

}){

    if(!element) return null;

    const registryItem=

        elementRegistry[element.type];

    if(!registryItem){

        console.warn(

            "Unknown element:",

            element.type

        );

        return null;

    }

    const Component=

        registryItem.component;

    return(

        <Component

            {...element.props}

        />

    );

}