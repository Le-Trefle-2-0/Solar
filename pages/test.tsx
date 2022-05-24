import { useState } from "react";


interface BoutonProps{onClick: ()=>void, text: string}   // => déclaration des types de variables que recevra le bouton
function Bouton({onClick, text}: BoutonProps){           // => déclaration du composant "Bouton" avec ses attributs typés
    return (                                             // => rendu du composant, ici, du HTML
        <button onClick={onClick}>{text}</button>        // => un élément HTML button avec pour fonction onClick et 
    );                                                   //    textContent les attributs du composant 
}

interface AfficheurProps{number: number}                 // => déclaration des types de variables que recevra le bouton
function Afficheur({number}: AfficheurProps){            // => déclaration du composant "Afficheur" avec ses attributs typés
    return (                                             // => rendu du composant, ici, du HTML
        <div>{number}</div>                              // => un élément HTML div avec pour textContent l'attribut number
    );
}

export default function Page(){                          // => déclaration du composant "Page" sans attribut
    let [chiffre, setChiffre] = useState(0);             // => déclaration de l'état "chiffre" qui contiendra le chiffre
    return (                                             // => rendu du composant, ici, du HTML
        <>                                         
            <Afficheur                                   // => utilisation de "Afficheur"
                number={chiffre}                         // => on renseigne l'attribut number avec le chiffre
            />
            <Bouton                                      // => utilisation de "Bouton"
                onClick={()=>{setChiffre(chiffre+1)}}    // => on renseigne une fonction qui incrémentera le chiffre
                text="un texte"                          // => on renseigne l'attribut text avec le texte du bouton
            />
        </>
    );
}







