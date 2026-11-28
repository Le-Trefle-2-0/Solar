"use client";

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {format, parseISO} from "date-fns";
import {fr} from "date-fns/locale";
import {Calendar as CalendarIcon, Clock, MessageSquare, TrendingUp, Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {DateRange} from "react-day-picker";
import {Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis} from "recharts";
import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart";

interface StatsData {
    volume: number;
    totalDuration: number;
    totalVolunteerSeconds: number;
    categoryCounts: Record<string, number>;
    feedbackStats: {
        age: Record<string, number>;
        feeling: Record<string, number>;
        gender: Record<string, number>;
        previouslyOpened: Record<string, number>;
        previouslyAtTrefle: Record<string, number>;
        location: Record<string, number>;
        region: Record<string, number>;
    };
    timeSeries: {
        date: string;
        volume: number;
        duration: number;
        volunteer: number;
    }[];
    startDate: string;
    endDate: string;
}

const chartConfig: ChartConfig = {
    volume: {
        label: "Volume d'écoutes",
        theme: {
            light: "#8cc088",
            dark: "#8cc088",
        },
    },
    durationMin: {
        label: "Temps d'écoute (min)",
        theme: {
            light: "#4ade80",
            dark: "#4ade80",
        },
    },
    volunteerHours: {
        label: "Bénévolat (heures)",
        theme: {
            light: "#22c55e",
            dark: "#22c55e",
        },
    },
    // Category colors
    count: {
        label: "Nombre",
        theme: {
            light: "#8cc088",
            dark: "#8cc088",
        },
    },
    // Feeling colors
    feeling_1: {
        label: "Pas du tout",
        theme: {light: "#7f1d1d", dark: "#7f1d1d"}
    },
    feeling_2: {
        label: "Pas vraiment",
        theme: {light: "#f87171", dark: "#f87171"}
    },
    feeling_3: {
        label: "Moyennement",
        theme: {light: "#facc15", dark: "#facc15"}
    },
    feeling_4: {
        label: "Un peu",
        theme: {light: "#86efac", dark: "#86efac"}
    },
    feeling_5: {
        label: "Oui vraiment",
        theme: {light: "#14532d", dark: "#14532d"}
    },
};

const PIE_COLORS = [
    "#bbf7d0", // Green 200 (Pastel)
    "#bfdbfe", // Blue 200 (Pastel)
    "#fef08a", // Yellow 200 (Pastel)
    "#fbcfe8", // Pink 200 (Pastel)
    "#ddd6fe", // Violet 200 (Pastel)
    "#99f6e4", // Teal 200 (Pastel)
    "#fed7aa", // Orange 200 (Pastel)
    "#a5f3fc", // Cyan 200 (Pastel)
];

export function StatsView() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [manualInterval, setManualInterval] = useState<string | null>(null);

    const getInterval = (range: DateRange | undefined) => {
        if (manualInterval) return manualInterval;
        if (!range?.from || !range?.to) return "day";
        const diffDays = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 365) return "month";
        if (diffDays > 90) return "week";
        return "day";
    };

    useEffect(() => {
        // Half-chosen range (first click in the calendar): nothing is fetched yet
        if (!date?.from || !date?.to) return;
        let current = true;
        // Whole days: the end day used to stop at midnight, so its écoutes were left out
        const start = new Date(date.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date.to);
        end.setHours(23, 59, 59, 999);
        const query = `?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&interval=${getInterval(date)}`;
        setLoading(true);
        apiFetch(`/v1/admin/stats${query}`)
            // An older answer arriving late never replaces the one for the period now shown
            .then(res => current && setData(res))
            .catch(e => console.error("Failed to fetch stats", e))
            .finally(() => current && setLoading(false));
        return () => {
            current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, manualInterval]);

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const shortcuts = [
        {label: "7j", days: 7, name: "7 derniers jours"},
        {label: "30j", days: 30, name: "30 derniers jours"},
        {label: "90j", days: 90, name: "90 derniers jours"},
        {label: "6 mois", days: 182, name: "6 derniers mois"},
        {label: "1 an", days: 365, name: "Dernière année"},
        {label: "2 ans", days: 730, name: "Deux dernières années"},
    ];

    if (loading && !data) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24"/>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16"/>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const categories = data ? Object.entries(data.categoryCounts).sort((a, b) => b[1] - a[1]) : [];
    const maxCount = categories.length > 0 ? categories[0][1] : 1;
    const barData = categories.map(([name, count]) => ({name, count}));

    const interval = getInterval(date);
    const chartData = data?.timeSeries.map(day => {
        const parsedDate = parseISO(day.date);
        let formattedDate = format(parsedDate, "dd MMM", {locale: fr});

        if (interval === "month") {
            formattedDate = format(parsedDate, "MMM yyyy", {locale: fr});
        } else if (interval === "week") {
            formattedDate = `Sem. ${format(parsedDate, "w", {locale: fr})}`;
        }

        return {
            ...day,
            formattedDate,
            durationMin: Math.round(day.duration / 60),
            volunteerHours: Math.round((day.volunteer / 3600) * 10) / 10
        };
    }) || [];

    const renderPieChart = (title: string, stats: Record<string, number>) => {
        const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return null;

        const data = entries.map(([name, count]) => ({name, count}));
        const total = entries.reduce((sum, [, count]) => sum + count, 0);

        return (
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0 px-2 text-center">
                    <CardTitle className="text-xs font-semibold leading-tight h-8 flex items-center">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[180px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel/>}
                            />
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="name"
                                innerRadius={40}
                                strokeWidth={2}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]}/>
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    {/* The figures in words: the chart alone shows them on hover only */}
                    <ul className="mt-2 space-y-1 text-xs">
                        {data.map((entry, index) => (
                            <li key={entry.name} className="flex items-center gap-2">
                                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm"
                                      style={{backgroundColor: PIE_COLORS[index % PIE_COLORS.length]}}/>
                                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {entry.count} ({Math.round(entry.count / total * 100)} %)
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        );
    };

    const renderFeelingChart = (stats: Record<string, number>) => {
        const order = ["pas du tout", "pas vraiment", "moyennement", "un peu", "oui vraiment"];
        const keysMap: Record<string, string> = {
            "pas du tout": "feeling_1",
            "pas vraiment": "feeling_2",
            "moyennement": "feeling_3",
            "un peu": "feeling_4",
            "oui vraiment": "feeling_5"
        };

        // The form stores "Oui vraiment" with a capital: compared without case, or it never counted
        const countOf = (label: string) => Object.entries(stats)
            .filter(([key]) => key.toLowerCase() === label)
            .reduce((sum, [, count]) => sum + count, 0);
        const data = order.map((label) => ({
            name: label.charAt(0).toUpperCase() + label.slice(1),
            count: countOf(label),
            feeling: keysMap[label]
        }));

        if (Object.keys(stats).length === 0) return null;

        return (
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Ressenti post-écoute</CardTitle>
                    <CardDescription>Impact émotionnel suite à l'échange</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
                            <ChartTooltip content={<ChartTooltipContent hideLabel/>}/>
                            <Bar
                                dataKey="count"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`}
                                          fill={chartConfig[entry.feeling as keyof typeof chartConfig]?.theme?.light as string}/>
                                ))}
                                <LabelList
                                    dataKey="count"
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true"/>
                                <span className="sr-only">Période : </span>
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd LLL y", {locale: fr})} -{" "}
                                            {format(date.to, "dd LLL y", {locale: fr})}
                                        </>
                                    ) : (
                                        format(date.from, "dd LLL y", {locale: fr})
                                    )
                                ) : (
                                    <span>Choisir une période</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="flex items-center bg-muted rounded-md p-1" role="group" aria-label="Périodes rapides">
                        {shortcuts.map((s) => (
                            <Button
                                key={s.label}
                                variant="ghost"
                                size="sm"
                                aria-label={s.name}
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                    setManualInterval(null);
                                    setDate({
                                        from: new Date(new Date().setDate(new Date().getDate() - s.days)),
                                        to: new Date(),
                                    });
                                }}
                            >
                                {s.label}
                            </Button>
                        ))}
                    </div>

                    <Select
                        value={manualInterval || getInterval(date)}
                        onValueChange={(v) => setManualInterval(v)}
                    >
                        <SelectTrigger className="w-[120px] h-9" aria-label="Regrouper les données">
                            <SelectValue placeholder="Intervalle"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Par jour</SelectItem>
                            <SelectItem value="week">Par semaine</SelectItem>
                            <SelectItem value="month">Par mois</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Volume d'écoutes</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.volume || 0}</div>
                        <p className="text-xs text-muted-foreground">Écoutes terminées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temps d'écoute</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatSeconds(data?.totalDuration || 0)}</div>
                        <p className="text-xs text-muted-foreground">Cumulé sur la période</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bénévolat (Planning)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatSeconds(data?.totalVolunteerSeconds || 0)}</div>
                        <p className="text-xs text-muted-foreground">Présence assurée</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Moyenne / écoute</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data?.volume && data.volume > 0
                                ? Math.round((data.totalDuration / data.volume) / 60)
                                : 0} min
                        </div>
                        <p className="text-xs text-muted-foreground">Durée moyenne</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Evolution du volume</CardTitle>
                        <CardDescription>
                            Nombre d'écoutes par {interval === "month" ? "mois" : interval === "week" ? "semaine" : "jour"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <AreaChart data={chartData} margin={{left: 12, right: 12}}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey="formattedDate"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
                                <ChartTooltip content={<ChartTooltipContent/>}/>
                                <Area
                                    type="monotone"
                                    dataKey="volume"
                                    stroke={chartConfig.volume.theme?.light as string}
                                    fill={chartConfig.volume.theme?.light as string}
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Engagement temporel</CardTitle>
                        <CardDescription>Temps d'écoute vs Bénévolat planning</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <AreaChart data={chartData} margin={{left: 12, right: 12}}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey="formattedDate"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
                                <ChartTooltip content={<ChartTooltipContent/>}/>
                                <Area
                                    type="monotone"
                                    dataKey="durationMin"
                                    stroke={chartConfig.durationMin.theme?.light as string}
                                    fill={chartConfig.durationMin.theme?.light as string}
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="volunteerHours"
                                    stroke={chartConfig.volunteerHours.theme?.light as string}
                                    fill={chartConfig.volunteerHours.theme?.light as string}
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par catégories</CardTitle>
                        <CardDescription>Principales thématiques abordées lors des échanges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {barData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <BarChart data={barData} layout="vertical" margin={{left: 30}}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                        className="text-[10px]"
                                    />
                                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8}/>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel/>}/>
                                    <Bar
                                        dataKey="count"
                                        fill={chartConfig.count.theme?.light as string}
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Aucune donnée catégorisée sur cette période.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {data?.feedbackStats?.feeling && Object.keys(data.feedbackStats.feeling).length > 0 && renderFeelingChart(data.feedbackStats.feeling)}
            </div>

            {data?.feedbackStats && Object.values(data.feedbackStats).some(s => Object.keys(s).length > 0) && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Retours utilisateurs (Feedback)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderPieChart("Tranches d'âge", data.feedbackStats.age)}
                        {renderPieChart("Genre", data.feedbackStats.gender)}
                        {renderPieChart("Déjà écouté auparavant", data.feedbackStats.previouslyOpened)}
                        {renderPieChart("Chez Le Trèfle 2.0", data.feedbackStats.previouslyAtTrefle)}
                        {renderPieChart("Localisation", data.feedbackStats.location)}
                        {renderPieChart("Région (France)", data.feedbackStats.region)}
                    </div>
                </div>
            )}
        </div>
    );
}
