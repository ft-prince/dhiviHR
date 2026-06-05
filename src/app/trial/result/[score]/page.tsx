export default async function TrialResultPage({params} : {params: {score: string}}) {
    const {score} = await params;
    return(
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 pt-20 sm:pt-24 pb-16">
            <h1 className="display-headline text-2xl sm:text-3xl md:text-4xl normal-case">Your dhiviHR Assessment Trial Result</h1>
            <p className="text-ink-soft mt-1 mb-8 text-base sm:text-lg">Your score: {score}</p>
        </div>
    )
}