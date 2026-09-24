// Short, neutral overviews for the public Books of the Bible pages
// (pages/books-of-the-bible). English only. Index 0 = Genesis (bibleOrder 1).
// Authorship is given as tradition ("traditionally attributed to") because
// scholars differ; sources are listed at the bottom of this file.

export type BibleBookSection =
  | 'Law'
  | 'History'
  | 'Poetry & Wisdom'
  | 'Major Prophets'
  | 'Minor Prophets'
  | 'Gospels'
  | 'Letters of Paul'
  | 'General Letters'
  | 'Prophecy';

export type BibleBookGuide = {
  section: BibleBookSection;
  overview: string;
  keyPassages: string[];
};

const bibleBookGuides: readonly BibleBookGuide[] = [
  // ── Old Testament ──
  {
    section: 'Law',
    overview: 'Genesis opens the Bible with the creation of the world, the first humans, the flood, and the scattering of the nations at Babel. Most of the book follows one family — Abraham, Isaac, Jacob, and Joseph — through whom God promises to bless all nations. It ends with Jacob\'s family settled in Egypt.',
    keyPassages: ['Genesis 1:1–2:3', 'Genesis 12:1–3', 'Genesis 50:20'],
  },
  {
    section: 'Law',
    overview: 'Exodus tells how the Israelites were rescued from slavery in Egypt under the leadership of Moses, through the plagues and the crossing of the sea. At Mount Sinai, God gives the Ten Commandments and makes a covenant with Israel. The book closes with detailed instructions for building the tabernacle, where God\'s presence would dwell among the people.',
    keyPassages: ['Exodus 3:1–15', 'Exodus 14', 'Exodus 20:1–17'],
  },
  {
    section: 'Law',
    overview: 'Leviticus is a book of instructions for Israel\'s worship and daily life, given to Moses at Sinai. It describes the sacrifices, the role of the priests, laws of ritual purity, and the yearly festivals, including the Day of Atonement. Its repeated theme is holiness: "Be holy, because I am holy."',
    keyPassages: ['Leviticus 16', 'Leviticus 19:18', 'Leviticus 23'],
  },
  {
    section: 'Law',
    overview: 'Numbers follows Israel through forty years in the wilderness between Mount Sinai and the edge of the promised land. It takes its name from the two censuses of the people, and it records their repeated complaints and rebellions — including the refusal to enter Canaan — alongside God\'s continued faithfulness.',
    keyPassages: ['Numbers 6:24–26', 'Numbers 13–14', 'Numbers 21:4–9'],
  },
  {
    section: 'Law',
    overview: 'Deuteronomy is presented as Moses\' farewell speeches to a new generation of Israelites about to enter the promised land. He retells their history, restates the law, and calls the people to love God with all their heart and to choose life by keeping the covenant. The book ends with the death of Moses.',
    keyPassages: ['Deuteronomy 6:4–9', 'Deuteronomy 30:15–20', 'Deuteronomy 34'],
  },
  {
    section: 'History',
    overview: 'Joshua records Israel\'s entry into Canaan under Moses\' successor, Joshua, beginning with the crossing of the Jordan and the fall of Jericho. It describes the conquest of the land and its division among the twelve tribes, and it ends with Joshua challenging the people to serve the Lord.',
    keyPassages: ['Joshua 1:1–9', 'Joshua 6', 'Joshua 24:14–15'],
  },
  {
    section: 'History',
    overview: 'Judges covers the unsettled period after Joshua, when Israel had no king. The book repeats a cycle: the people turn away from God, are oppressed by enemies, cry out, and are rescued by leaders called judges — among them Deborah, Gideon, and Samson. Its closing refrain is that "everyone did what was right in his own eyes."',
    keyPassages: ['Judges 2:10–19', 'Judges 4–5', 'Judges 21:25'],
  },
  {
    section: 'History',
    overview: 'Ruth is a short story set in the time of the judges. After tragedy strikes her family, a Moabite widow named Ruth stays loyal to her mother-in-law Naomi, and she is redeemed and married by Boaz. The book ends by revealing that Ruth became the great-grandmother of King David.',
    keyPassages: ['Ruth 1:16–17', 'Ruth 4:13–22'],
  },
  {
    section: 'History',
    overview: '1 Samuel tells of Israel\'s transition from judges to kings. It follows the prophet Samuel, the reign of Israel\'s first king, Saul, and the rise of the young David, including his victory over Goliath and his years as a fugitive from Saul.',
    keyPassages: ['1 Samuel 3', '1 Samuel 16:7', '1 Samuel 17'],
  },
  {
    section: 'History',
    overview: '2 Samuel covers the reign of King David: his rule over all Israel, the capture of Jerusalem, and God\'s promise that David\'s dynasty would endure forever. It also records David\'s sin with Bathsheba and the turmoil in his family that followed, including Absalom\'s rebellion.',
    keyPassages: ['2 Samuel 7', '2 Samuel 11–12', '2 Samuel 22'],
  },
  {
    section: 'History',
    overview: '1 Kings begins with the reign of Solomon, his wisdom, and the building of the temple in Jerusalem. After Solomon\'s death the kingdom splits into Israel in the north and Judah in the south. The second half features the prophet Elijah and his confrontation with King Ahab and the prophets of Baal.',
    keyPassages: ['1 Kings 3', '1 Kings 8', '1 Kings 18–19'],
  },
  {
    section: 'History',
    overview: '2 Kings continues the history of the divided kingdoms, beginning with the ministry of Elisha. It traces a long line of kings, most of whom lead the people away from God, until the northern kingdom falls to Assyria and, later, Judah and Jerusalem fall to Babylon.',
    keyPassages: ['2 Kings 2', '2 Kings 5', '2 Kings 17', '2 Kings 25'],
  },
  {
    section: 'History',
    overview: '1 Chronicles retells Israel\'s history from a later vantage point. It opens with long genealogies from Adam onward, then focuses on the reign of David, especially his preparations for the temple and the organization of its worship.',
    keyPassages: ['1 Chronicles 16:8–36', '1 Chronicles 17', '1 Chronicles 29:10–13'],
  },
  {
    section: 'History',
    overview: '2 Chronicles continues from Solomon\'s reign and the dedication of the temple through the kings of Judah, highlighting reforming kings such as Hezekiah and Josiah. It ends with the Babylonian exile and the decree of Cyrus allowing the exiles to return.',
    keyPassages: ['2 Chronicles 7:14', '2 Chronicles 34', '2 Chronicles 36:22–23'],
  },
  {
    section: 'History',
    overview: 'Ezra describes the return of Jewish exiles from Babylon to Jerusalem and the rebuilding of the temple despite opposition. In the second half, Ezra the priest and scribe arrives and leads the community to recommit to God\'s law.',
    keyPassages: ['Ezra 1', 'Ezra 3:10–13', 'Ezra 7:10'],
  },
  {
    section: 'History',
    overview: 'Nehemiah is written largely as the first-person memoir of a Jewish official in the Persian court who returns to Jerusalem to rebuild its ruined walls. The book records his prayer, his leadership in the face of opposition, the public reading of the law, and the people\'s renewal of the covenant.',
    keyPassages: ['Nehemiah 1', 'Nehemiah 4', 'Nehemiah 8'],
  },
  {
    section: 'History',
    overview: 'Esther is set in the Persian empire, where a young Jewish woman becomes queen. When the official Haman plots to destroy the Jewish people, Esther risks her life to intervene. The story explains the origin of the festival of Purim and is known for never mentioning God by name.',
    keyPassages: ['Esther 4:14', 'Esther 7', 'Esther 9:20–28'],
  },
  {
    section: 'Poetry & Wisdom',
    overview: 'Job wrestles with the question of why the righteous suffer. After Job loses his wealth, children, and health, he and his friends argue at length in poetry about the reason. God finally answers Job out of the whirlwind, and Job\'s fortunes are restored.',
    keyPassages: ['Job 1–2', 'Job 19:25–27', 'Job 38–42'],
  },
  {
    section: 'Poetry & Wisdom',
    overview: 'Psalms is a collection of 150 songs and prayers used in Israel\'s worship, many traditionally attributed to David. They cover the full range of human experience — praise, thanksgiving, lament, confession, trust, and hope — and the book has long served as a prayer book for Jews and Christians.',
    keyPassages: ['Psalm 1', 'Psalm 23', 'Psalm 51', 'Psalm 119'],
  },
  {
    section: 'Poetry & Wisdom',
    overview: 'Proverbs is a collection of wise sayings, many traditionally attributed to Solomon, about living well in everyday life: work, speech, money, friendship, family, and integrity. Its foundation is that "the fear of the Lord is the beginning of wisdom."',
    keyPassages: ['Proverbs 1:7', 'Proverbs 3:5–6', 'Proverbs 31:10–31'],
  },
  {
    section: 'Poetry & Wisdom',
    overview: 'Ecclesiastes is the reflection of "the Teacher," traditionally identified with Solomon, on the meaning of life. Observing that everything "under the sun" seems fleeting, he explores pleasure, work, wisdom, and wealth, and concludes by urging readers to enjoy God\'s gifts, fear God, and keep his commandments.',
    keyPassages: ['Ecclesiastes 1:1–11', 'Ecclesiastes 3:1–8', 'Ecclesiastes 12:13–14'],
  },
  {
    section: 'Poetry & Wisdom',
    overview: 'Song of Songs (also called Song of Solomon) is a collection of love poetry celebrating the love between a bride and her beloved. Jewish and Christian readers have also long read it as a picture of the love between God and his people.',
    keyPassages: ['Song of Songs 2:10–13', 'Song of Songs 8:6–7'],
  },
  {
    section: 'Major Prophets',
    overview: 'Isaiah contains the messages of the prophet Isaiah to Judah and Jerusalem. It warns of judgment for injustice and idolatry, then offers comfort and hope: a coming king, a suffering servant, and a promised new creation. It is one of the Old Testament books most often quoted in the New Testament.',
    keyPassages: ['Isaiah 6', 'Isaiah 9:6–7', 'Isaiah 40', 'Isaiah 53'],
  },
  {
    section: 'Major Prophets',
    overview: 'Jeremiah records the ministry of a prophet who warned Judah for decades before Jerusalem fell to Babylon, often facing rejection and persecution. Alongside his warnings he speaks of hope, including God\'s promise of a new covenant written on the heart.',
    keyPassages: ['Jeremiah 1:4–10', 'Jeremiah 29:11', 'Jeremiah 31:31–34'],
  },
  {
    section: 'Major Prophets',
    overview: 'Lamentations is a set of five poems mourning the destruction of Jerusalem by Babylon, traditionally attributed to Jeremiah. Amid its grief it includes one of the Bible\'s best-known expressions of hope: God\'s mercies "are new every morning."',
    keyPassages: ['Lamentations 3:21–26'],
  },
  {
    section: 'Major Prophets',
    overview: 'Ezekiel was a priest and prophet among the exiles in Babylon. His book is known for dramatic visions — the glory of God, the departure of God\'s presence from the temple, and the valley of dry bones — and it ends with a vision of a restored temple and land.',
    keyPassages: ['Ezekiel 1', 'Ezekiel 36:26–27', 'Ezekiel 37:1–14'],
  },
  {
    section: 'Major Prophets',
    overview: 'Daniel begins with stories of Daniel and his friends staying faithful to God in the Babylonian and Persian courts, including the fiery furnace and the lions\' den. The second half contains apocalyptic visions of successive empires and God\'s everlasting kingdom.',
    keyPassages: ['Daniel 3', 'Daniel 6', 'Daniel 7:13–14'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Hosea is the first of the twelve shorter prophetic books. The prophet\'s marriage to an unfaithful wife becomes a living picture of Israel\'s unfaithfulness to God — and of God\'s persistent, redeeming love.',
    keyPassages: ['Hosea 3:1', 'Hosea 6:6', 'Hosea 11:1–9'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Joel uses a devastating locust plague as a warning of the coming "day of the Lord" and calls the people to return to God with all their heart. It includes the promise that God will pour out his Spirit on all people, which is quoted in Acts 2.',
    keyPassages: ['Joel 2:12–13', 'Joel 2:28–32'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Amos was a shepherd from Judah sent to prophesy to the prosperous northern kingdom of Israel. He condemns the oppression of the poor and empty religious ritual, calling instead for justice to "roll on like a river."',
    keyPassages: ['Amos 5:21–24', 'Amos 9:11–15'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Obadiah is the shortest book in the Old Testament — a single chapter. It announces judgment on the nation of Edom for its pride and for its violence against Judah, and it ends with the promise that the kingdom will belong to the Lord.',
    keyPassages: ['Obadiah 1:15', 'Obadiah 1:21'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Jonah tells the story of a prophet who runs from God\'s call to preach to Nineveh, the capital of Israel\'s enemy Assyria. After being swallowed by a great fish, he finally goes — and is angry when the city repents and God shows mercy.',
    keyPassages: ['Jonah 1–2', 'Jonah 4:2', 'Jonah 4:10–11'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Micah speaks against injustice and corruption in both Israel and Judah, and foretells a ruler who will come from Bethlehem. It is known for its summary of what God requires: "to act justly, to love mercy, and to walk humbly with your God."',
    keyPassages: ['Micah 5:2', 'Micah 6:8'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Nahum announces the downfall of Nineveh, the capital of the Assyrian empire that had brutally oppressed many nations, including Israel. For Judah, the message of Nineveh\'s fall is good news.',
    keyPassages: ['Nahum 1:7', 'Nahum 1:15'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Habakkuk is a dialogue between the prophet and God. Habakkuk asks why God allows injustice, and why he would use the violent Babylonians to judge Judah. The book ends with a prayer of trust: even if everything fails, "I will rejoice in the God of my salvation."',
    keyPassages: ['Habakkuk 1:2–4', 'Habakkuk 2:4', 'Habakkuk 3:17–19'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Zephaniah warns of the coming "day of the Lord" against Judah and the surrounding nations. It closes with a promise of restoration and a picture of God rejoicing over his people with singing.',
    keyPassages: ['Zephaniah 1:14–18', 'Zephaniah 3:17'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Haggai is a short book of messages to the Jews who had returned from exile. The prophet urges them to stop neglecting the unfinished temple and resume rebuilding it, promising that God is with them.',
    keyPassages: ['Haggai 1:3–8', 'Haggai 2:4–9'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Zechariah, a contemporary of Haggai, encourages the returned exiles with a series of night visions and prophecies about the future of Jerusalem. It includes the picture of a king coming "humble and riding on a donkey," which the Gospels connect to Jesus.',
    keyPassages: ['Zechariah 4:6', 'Zechariah 9:9'],
  },
  {
    section: 'Minor Prophets',
    overview: 'Malachi, the last book of the Old Testament in Christian Bibles, confronts the returned community\'s half-hearted worship, broken marriages, and withheld tithes. It ends by promising a messenger who will prepare the way for the Lord.',
    keyPassages: ['Malachi 3:1', 'Malachi 3:10', 'Malachi 4:5–6'],
  },
  // ── New Testament ──
  {
    section: 'Gospels',
    overview: 'Matthew is the first of the four Gospels, accounts of the life, death, and resurrection of Jesus. Written with a strong connection to the Old Testament, it presents Jesus as the promised Messiah and includes five major blocks of his teaching, among them the Sermon on the Mount.',
    keyPassages: ['Matthew 5–7', 'Matthew 16:13–20', 'Matthew 28:18–20'],
  },
  {
    section: 'Gospels',
    overview: 'Mark is the shortest Gospel and is fast-paced, often moving from scene to scene "immediately." It focuses on the actions of Jesus — his miracles, his conflict with religious leaders, and especially his final week, death, and resurrection.',
    keyPassages: ['Mark 1:14–15', 'Mark 8:27–38', 'Mark 10:45'],
  },
  {
    section: 'Gospels',
    overview: 'Luke is an orderly account of the life of Jesus, traditionally attributed to Luke, a physician and companion of Paul. It gives special attention to the poor, outsiders, women, and prayer, and it includes many well-known parables, such as the Good Samaritan and the Prodigal Son. Acts is its sequel.',
    keyPassages: ['Luke 2:1–20', 'Luke 10:25–37', 'Luke 15'],
  },
  {
    section: 'Gospels',
    overview: 'John is the fourth Gospel and differs in style from the other three. It is built around signs that reveal who Jesus is and his "I am" sayings, and it gives extended attention to his final evening with his disciples. It states its own purpose: "that you may believe that Jesus is the Christ, the Son of God."',
    keyPassages: ['John 1:1–18', 'John 3:16', 'John 20:30–31'],
  },
  {
    section: 'History',
    overview: 'Acts continues the story from Luke\'s Gospel. After Jesus\' ascension and the coming of the Holy Spirit at Pentecost, the message about Jesus spreads from Jerusalem across the Roman world, first through Peter and then through the missionary journeys of Paul.',
    keyPassages: ['Acts 1:8', 'Acts 2', 'Acts 9:1–19'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Romans is Paul\'s longest letter and his most systematic explanation of the gospel. It explains how both Jews and Gentiles are made right with God through faith in Christ, describes life in the Spirit, and gives practical instruction for life together in the church.',
    keyPassages: ['Romans 3:21–26', 'Romans 8', 'Romans 12:1–2'],
  },
  {
    section: 'Letters of Paul',
    overview: '1 Corinthians is Paul\'s letter to a gifted but divided church in the city of Corinth. He addresses divisions, immorality, lawsuits, marriage, worship, and spiritual gifts, and it contains the famous chapter on love and a central passage on the resurrection.',
    keyPassages: ['1 Corinthians 13', '1 Corinthians 15:1–8'],
  },
  {
    section: 'Letters of Paul',
    overview: '2 Corinthians is Paul\'s most personal letter. Defending his ministry against critics, he writes about suffering, weakness, reconciliation, and generosity, returning often to the theme that God\'s power is made perfect in weakness.',
    keyPassages: ['2 Corinthians 4:7–18', '2 Corinthians 5:17–21', '2 Corinthians 12:9'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Galatians is a forceful letter to churches being told that Gentile believers must follow the Jewish law to belong to God\'s people. Paul insists that people are justified by faith in Christ, not by works of the law, and describes the freedom and "fruit of the Spirit" that follow.',
    keyPassages: ['Galatians 2:20', 'Galatians 5:1', 'Galatians 5:22–23'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Ephesians describes the spiritual blessings believers have in Christ and God\'s plan to unite Jews and Gentiles in one body, the church. The second half applies this to everyday life, relationships, and putting on "the full armor of God."',
    keyPassages: ['Ephesians 2:8–10', 'Ephesians 4:1–6', 'Ephesians 6:10–18'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Philippians is a warm letter of thanks that Paul wrote from prison to a church he loved. Its recurring note is joy, and it includes a hymn about Christ humbling himself, along with encouragement not to be anxious but to pray about everything.',
    keyPassages: ['Philippians 2:5–11', 'Philippians 4:4–7', 'Philippians 4:13'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Colossians emphasizes the supremacy and sufficiency of Christ against teachings that were adding to the gospel. It then describes the new life believers have in him, with practical instruction for households.',
    keyPassages: ['Colossians 1:15–20', 'Colossians 3:1–17'],
  },
  {
    section: 'Letters of Paul',
    overview: '1 Thessalonians is one of Paul\'s earliest letters, written to a young church facing persecution. He encourages them in faith, love, and holy living, and comforts them about believers who have died, with teaching on Christ\'s return.',
    keyPassages: ['1 Thessalonians 4:13–18', '1 Thessalonians 5:16–18'],
  },
  {
    section: 'Letters of Paul',
    overview: '2 Thessalonians is a short follow-up letter correcting confusion about the day of the Lord, which some believed had already come. Paul encourages the church to stand firm and warns against idleness.',
    keyPassages: ['2 Thessalonians 2:15', '2 Thessalonians 3:6–13'],
  },
  {
    section: 'Letters of Paul',
    overview: '1 Timothy is a letter from Paul to his younger coworker Timothy, who was leading the church in Ephesus. It gives guidance on false teaching, worship, qualifications for church leaders, and care for different groups within the church.',
    keyPassages: ['1 Timothy 1:15', '1 Timothy 3:1–13', '1 Timothy 6:6–12'],
  },
  {
    section: 'Letters of Paul',
    overview: '2 Timothy is presented as Paul\'s final letter, written from prison near the end of his life. He urges Timothy to guard the gospel, endure hardship, and hold on to the Scriptures, and he reflects: "I have fought the good fight, I have finished the race."',
    keyPassages: ['2 Timothy 3:16–17', '2 Timothy 4:7'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Titus is a short letter from Paul to his coworker Titus, who was appointing leaders in the churches on the island of Crete. It links sound teaching with good works and godly living.',
    keyPassages: ['Titus 2:11–14', 'Titus 3:4–7'],
  },
  {
    section: 'Letters of Paul',
    overview: 'Philemon is a one-chapter personal letter. Paul appeals to Philemon to welcome back Onesimus, a runaway slave who had become a Christian, "no longer as a slave, but better than a slave, as a beloved brother."',
    keyPassages: ['Philemon 1:15–16'],
  },
  {
    section: 'General Letters',
    overview: 'Hebrews is an anonymous letter-sermon, traditionally understood as written to Jewish Christians tempted to turn back. It argues that Jesus is greater than the angels, Moses, and the priesthood, and that his sacrifice fulfills the old covenant. Chapter 11 is a well-known roll call of faithful men and women from Israel\'s history.',
    keyPassages: ['Hebrews 4:12–16', 'Hebrews 11', 'Hebrews 12:1–2'],
  },
  {
    section: 'General Letters',
    overview: 'James, traditionally attributed to the brother of Jesus, is a practical letter about living out faith. It covers trials, controlling the tongue, favoritism toward the rich, and the principle that "faith without deeds is dead."',
    keyPassages: ['James 1:2–5', 'James 1:22', 'James 2:14–26'],
  },
  {
    section: 'General Letters',
    overview: '1 Peter is written to believers scattered across Asia Minor who were suffering for their faith. It reminds them of their living hope and their identity as God\'s people, and calls them to holy living and to follow Christ\'s example in suffering.',
    keyPassages: ['1 Peter 1:3–9', '1 Peter 2:9–10', '1 Peter 5:6–7'],
  },
  {
    section: 'General Letters',
    overview: '2 Peter is a short letter urging believers to grow in godliness and to remember the apostles\' teaching. It warns against false teachers and addresses those who scoff at the promise of Christ\'s return.',
    keyPassages: ['2 Peter 1:3–11', '2 Peter 3:8–9'],
  },
  {
    section: 'General Letters',
    overview: '1 John is a letter traditionally attributed to the apostle John. It gives readers tests for assurance — believing that Jesus is the Christ, obeying God\'s commands, and loving one another — and it declares that "God is love."',
    keyPassages: ['1 John 1:9', '1 John 4:7–21'],
  },
  {
    section: 'General Letters',
    overview: '2 John is a very short letter from "the elder" to "the chosen lady and her children," urging them to walk in love and truth and not to welcome false teachers.',
    keyPassages: ['2 John 1:6'],
  },
  {
    section: 'General Letters',
    overview: '3 John is a short personal letter from "the elder" to Gaius, commending his hospitality to traveling Christian workers and contrasting it with the behavior of Diotrephes.',
    keyPassages: ['3 John 1:4', '3 John 1:11'],
  },
  {
    section: 'General Letters',
    overview: 'Jude, traditionally attributed to a brother of James and of Jesus, is a one-chapter letter urging believers to "contend earnestly for the faith" against false teachers. It ends with a well-known doxology.',
    keyPassages: ['Jude 1:3', 'Jude 1:24–25'],
  },
  {
    section: 'Prophecy',
    overview: 'Revelation, the last book of the Bible, records a series of visions given to John. It opens with letters to seven churches, then uses vivid symbolic imagery to depict the conflict between God and evil and its resolution, ending with a new heaven and a new earth.',
    keyPassages: ['Revelation 1:4–8', 'Revelation 5', 'Revelation 21:1–5'],
  },
];

export default bibleBookGuides;

/*
 * Sources (internal reference):
 * - BibleProject book overviews: https://bibleproject.com/explore/book-overviews/
 * - Encyclopaedia Britannica, entries on individual biblical books: https://www.britannica.com/topic/Bible
 * - Berean Standard Bible text (public domain): https://berean.bible/
 * - Blue Letter Bible book introductions: https://www.blueletterbible.org/
 */
