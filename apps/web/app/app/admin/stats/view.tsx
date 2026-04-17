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
import {Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";
import {ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart";

interface StatsData {
    volume: number;
    totalDuration: number;
    totalVolunteerSeconds: number;
    categoryCounts: Record<string, number>;
    timeSeries: {
        date: string;
        volume: number;
        duration: number;
        volunteer: number;
    }[];
    startDate: string;
    endDate: string;
}

const chartConfig = {
    volume: {
        label: "Volume d'écoutes",
        color: "hsl(var(--primary))",
    },
    duration: {
        label: "Temps d'écoute (min)",
        color: "hsl(var(--chart-2))",
    },
    volunteer: {
        label: "Bénévolat (heures)",
        color: "hsl(var(--chart-3))",
    },
    count: {
        label: "Nombre d'écoutes",
        color: "hsl(var(--primary))",
    }
};

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

    const fetchStats = async () => {
        setLoading(true);
        try {
            const startStr = date?.from?.toISOString();
            const endStr = date?.to?.toISOString();
            const interval = getInterval(date);
            const query = (startStr && endStr) ? `?start=${startStr}&end=${endStr}&interval=${interval}` : "";
            const res = await apiFetch(`/v1/admin/stats${query}`);
            setData(res);
        } catch (e) {
            console.error("Failed to fetch stats", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [date, manualInterval]);

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const shortcuts = [
        {label: "7j", days: 7},
        {label: "30j", days: 30},
        {label: "90j", days: 90},
        {label: "6 mois", days: 182},
        {label: "1 an", days: 365},
        {label: "2 ans", days: 730},
    ];

    if (loading && !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <CalendarIcon className="mr-2 h-4 w-4"/>
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

                    <div className="flex items-center bg-muted rounded-md p-1">
                        {shortcuts.map((s) => (
                            <Button
                                key={s.label}
                                variant="ghost"
                                size="sm"
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
                        <SelectTrigger className="w-[120px] h-9">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Volume d'écoutes</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.volume || 0}</div>
                        <p className="text-xs text-muted-foreground">Tickets terminés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temps d'écoute</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatSeconds(data?.totalDuration || 0)}</div>
                        <p className="text-xs text-muted-foreground">Cumulé sur la période</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bénévolat (Planning)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatSeconds(data?.totalVolunteerSeconds || 0)}</div>
                        <p className="text-xs text-muted-foreground">Présence assurée</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Moyenne / écoute</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground"/>
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
                        <CardDescription>Nombre d'écoutes par jour</CardDescription>
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
                                <YAxis hide/>
                                <ChartTooltip content={<ChartTooltipContent/>}/>
                                <Area
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="var(--color-volume)"
                                    fill="var(--color-volume)"
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
                                <YAxis hide/>
                                <ChartTooltip content={<ChartTooltipContent/>}/>
                                <Area
                                    type="monotone"
                                    dataKey="durationMin"
                                    stroke="var(--color-duration)"
                                    fill="var(--color-duration)"
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="volunteerHours"
                                    stroke="var(--color-volunteer)"
                                    fill="var(--color-volunteer)"
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
                                    <XAxis type="number" hide/>
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                        className="text-[10px]"
                                    />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel/>}/>
                                    <Bar
                                        dataKey="count"
                                        fill="var(--color-count)"
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
            </div>
        </div>
    );
}
