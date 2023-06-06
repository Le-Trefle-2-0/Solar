import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import getSession from "../src/utils/get_session";
import { getRoles } from "./api/roles";
import { Line, Bar } from "react-chartjs-2";
import { useState } from "react";

Chart.register(CategoryScale);

export default function Stats(){
    const router = useRouter();
    const session = useRef(getSession());
    const [ListenCount] = useState({
        labels: ['01/01','02/01', '03/01', '04/01', '05/01', '06/01', '07/01'],
        datasets: [{
            label: "Écoutes",
            data: ['6', '10', '5', '2', '9', '8', '4'],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 2
        },
        {
            label: "Bénévoles",
            data: ['1', '2', '1', '1', '2', '3', '4'],
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 2
        }]
    });
    const [ListenAge] = useState({
        labels: ['01/01', '02/01', '03/01', '04/01', '05/01', '06/01', '07/01'],
        datasets: [{
            label: "Mineurs",
            data: ['1', '2', '1', '1', '2', '3', '4'],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 2
        },
        {
            label: "Majeurs",
            data: ['5', '8', '4', '1', '7', '5', '0'],
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 2
        }]
    });

    
    useEffect(()=>{
        if(!session.current?.user.is_admin) router.push("/");
    }, []);
  
  
    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2 className="">STATISTIQUES</h2>
            </div>
            <div className="flex flex-col items-center mb-8 justify-between">
                    <Line data={ListenCount} options={{
                        plugins: {
                            title: {
                                display: true,
                                text: "Écoutes par jour"
                            }
                        }
                    }} />
                    <Bar data={ListenAge} options={{
                        plugins: {
                            title: {
                                display: true,
                                text: "Écoutes par tranche d'âge"
                            }
                        }
                    }} />
            </div>
        </AuthenticatedLayout>
    );
}