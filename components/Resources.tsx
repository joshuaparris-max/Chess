export default function Resources() {
  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-5">
        <h2 className="text-2xl font-bold">Free Chess Resources</h2>
        <p className="mt-3 max-w-4xl text-slate-300">
          Listen, read, train, and explore high-quality chess content without any cost. This section groups public domain audio, free books, training platforms, and analysis tools.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel rounded-3xl p-5">
          <h3 className="text-xl font-bold text-teal-200">Public Domain Audiobooks & Audio Podcasts</h3>
          <p className="mt-2 text-slate-300">These resources let you listen to chess history, fiction, interviews, and concepts entirely for free.</p>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-slate-200">
            <li>
              <a href="https://www.youtube.com/watch?v=Qo70tszH7xo" className="font-semibold text-teal-200 hover:text-teal-100">The Immortal Game (YouTube Preview)</a>: Listen to an audio preview of David Shenk's highly acclaimed narrative on how chess shaped history and culture.
            </li>
            <li>
              <a href="https://www.youtube.com/watch?v=UEa2NYR18Xs" className="font-semibold text-teal-200 hover:text-teal-100">Chess Opening Names (YouTube Audio)</a>: A specialized audiobook by Nathan Rose exploring the funny and historic stories behind how common chess openings got their names.
            </li>
            <li>
              <a href="https://www.youtube.com/watch?v=MQ318PrpcKM" className="font-semibold text-teal-200 hover:text-teal-100">The Chess Revolution (Audiobook Preview)</a>: Peter Doggers' audio overview detailing how technology and AI completely changed the modern landscape of chess.
            </li>
            <li>
              <a href="https://open.spotify.com/show/2MJk1y6KXBUzGQwdC9qxdN" className="font-semibold text-teal-200 hover:text-teal-100">Audible Chess on Spotify</a>: A unique podcast series that acts as an audiobook tool, teaching chess history, classic games, and master concepts through audio queues.
            </li>
            <li>
              <a href="https://www.audible.com/podcast/Audible-Chess/B08K58JNK3?srsltid=AfmBOoqi2iI8c7qq1iTQhg6HLBqsU0aZNOCLR6MdgT5uZrgncMU6J7gH" className="font-semibold text-teal-200 hover:text-teal-100">Perpetual Chess Podcast</a>: The ultimate weekly auditory resource featuring deep-dive interviews with grandmasters, coaches, and book authors discussing training habits.
            </li>
            <li>
              <span className="font-semibold text-teal-200">The Chess Experience Podcast</span>: A podcast specifically aimed at adult improvers, detailing actionable learning strategies you can listen to while commuting.
            </li>
            <li>
              <span className="font-semibold text-teal-200">Dojo Talks Chess Podcast</span>: Hosted by prominent International Masters and Grandmasters, this audio series analyzes current events and details training structures.
            </li>
            <li>
              <span className="font-semibold text-teal-200">Project Gutenberg's Chess History and Reminiscences</span>: Access historical texts written by H.E. Bird, which can be read using standard automated text-to-speech mobile e-readers.
            </li>
          </ol>
        </article>

        <article className="glass-panel rounded-3xl p-5">
          <h3 className="text-xl font-bold text-teal-200">Free E-Books & Interactive Reading Platforms</h3>
          <p className="mt-2 text-slate-300">Rather than just listening, these interactive platforms allow you to read texts while moving pieces on a built-in virtual board.</p>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-slate-200">
            <li>Chess Fundamentals by José Raúl Capablanca: A timeless, foundational text written by a former World Champion, freely available via Project Gutenberg.</li>
            <li>Chess and Checkers: The Way to Mastership: Edward Lasker's public domain textbook providing detailed explanations of structural play and game fundamentals.</li>
            <li>Chess Strategy by Edward Lasker: Another classic text hosted on Project Gutenberg covering high-level piece coordination and strategic plans.</li>
            <li>
              <a href="https://www.chessable.com/chess-strategy/all/all/free/" className="font-semibold text-teal-200 hover:text-teal-100">Chessable Free Courses</a>: Offers massive digital books utilizing MoveTrainer technology to drill positions via spaced repetition.
            </li>
            <li>ChessManiac Free E-Books: A legacy database hosting a wide variety of downloadable, vintage chess instructional texts.</li>
            <li>ChessKid Beginner's Guide: A fully downloadable, interactive digital e-book targeted toward teaching basic board rules to children and beginners.</li>
            <li>
              <a href="https://www.youtube.com/watch?v=sxE7yiQnOx4" className="font-semibold text-teal-200 hover:text-teal-100">How to Reassess Your Chess Audio Read (YouTube)</a>: A full text-and-audio breakdown of Jeremy Silman's masterclass on finding structural positional imbalances on the board.
            </li>
          </ol>
        </article>
      </div>

      <article className="glass-panel rounded-3xl p-5">
        <h3 className="text-xl font-bold text-teal-200">All-in-One Training & Gameplay Websites</h3>
        <p className="mt-2 text-slate-300">The foundational engines and software suites used to train, play, and practice.</p>
        <ol className="mt-4 list-decimal space-y-4 pl-5 text-slate-200">
          <li><a href="https://lichess.org/" className="font-semibold text-teal-200 hover:text-teal-100">Lichess</a>: A 100% free, open-source chess platform that includes an entirely unrestricted engine, puzzles, and community database.</li>
          <li>Chess.com: The largest online chess community featuring robust free tiers for daily play, custom bots, and fundamental introductory guides.</li>
          <li>ChessKid: A spin-off of Chess.com curated with heavily moderated, child-safe features, cartoon animations, and basic lesson trees.</li>
          <li>Free Internet Chess Server (FICS): One of the oldest free online gaming platforms that supports a massive array of downloadable third-party desktop interfaces.</li>
          <li>Chessmood Unlocked Blog: A high-end training resource run by Grandmasters that regularly opens up premium tactical blogs and video courses for free.</li>
          <li><a href="https://www.tapsmart.com/tips-and-tricks/chess-mastery/" className="font-semibold text-teal-200 hover:text-teal-100">Learn Chess with Dr. Wolf</a>: An interactive, automated coaching app that guides you through games by explaining the mistakes you make in real time.</li>
        </ol>
      </article>

      <article className="glass-panel rounded-3xl p-5">
        <h3 className="text-xl font-bold text-teal-200">Analysis Databases, Software, & Specialized Tools</h3>
        <p className="mt-2 text-slate-300">Professional tools used to analyze historical games and build opening databases.</p>
        <ol className="mt-4 list-decimal space-y-4 pl-5 text-slate-200">
          <li><a href="https://theweekinchess.com/" className="font-semibold text-teal-200 hover:text-teal-100">The Week in Chess (TWIC)</a>: Mark Crowther's historic repository providing free, weekly downloadable PGN files of thousands of Grandmaster tournament games.</li>
          <li><a href="https://www.chessgames.com/" className="font-semibold text-teal-200 hover:text-teal-100">Chessgames Database</a>: A historic archive of millions of games where you can look up specific players, opening traps, and grandmaster match histories.</li>
          <li><a href="https://www.365chess.com/" className="font-semibold text-teal-200 hover:text-teal-100">365Chess</a>: A massive online opening explorer database allowing you to test theoretical move lines and observe win/loss statistics.</li>
          <li>Chesstempo: Widely considered one of the absolute best free tactical training sites for endgame drills and customized puzzle themes.</li>
          <li><a href="https://scidvspc.sourceforge.net/" className="font-semibold text-teal-200 hover:text-teal-100">Scid vs PC</a>: A highly robust, open-source desktop chess database application used to filter games, write notes, and analyze lines.</li>
          <li><a href="https://stockfishchess.org/" className="font-semibold text-teal-200 hover:text-teal-100">Stockfish Chess Engine</a>: The strongest, completely free open-source chess engine in the world that can be integrated into local desktop software.</li>
          <li><a href="https://www.reddit.com/r/chess/wiki/resources/" className="font-semibold text-teal-200 hover:text-teal-100">ChessPuzzle Net</a>: A free puzzle generator that strips positions straight from real, modern tournament games rather than artificial setups.</li>
          <li>Chessily: An introductory site dedicated entirely to outlining foundational chess theories and opening concepts for newer players.</li>
          <li><a href="https://chess.stackexchange.com/questions/1335/free-learning-material" className="font-semibold text-teal-200 hover:text-teal-100">Exeter Chess Club Coaching</a>: A legendary collection of coaching archives containing hundreds of instructional articles detailing piece dynamics and structural rules.</li>
        </ol>
      </article>
    </section>
  );
}
