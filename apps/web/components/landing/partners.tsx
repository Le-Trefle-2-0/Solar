export function Partners() {
    const partners = [
        "Microsoft 365",
        "Microsoft Azure",
        "Éducation Nationale",
        "Académie de Montpellier",
        "Discord"
    ];

    return (
        <section className="py-12 bg-muted/50 w-full">
            <div className="px-4 md:px-8 w-full">
                <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                    Avec le soutien de
                </h3>
                <div
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale transition hover:grayscale-0">
                    {partners.map((partner) => (
                        <span key={partner} className="text-xl font-bold text-muted-foreground">{partner}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}
