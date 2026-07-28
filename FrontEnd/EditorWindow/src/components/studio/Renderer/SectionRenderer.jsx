import ElementRenderer from "./ElementRenderer";

export default function SectionRenderer({

    children = [],

}){

    return(

        <>

        {

        children.map((element)=>(

            <ElementRenderer

                key={element.id}

                element={element}

            />

        ))

        }

        </>

    );

}