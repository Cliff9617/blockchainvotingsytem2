/**
 * DeVote AI Assistant Knowledge Base
 * 
 * This file contains structured knowledge for the AI voter assistant.
 * It uses keyword matching to provide relevant responses to voter questions.
 * 
 * IMPORTANT: This is a rule-based system. For production, consider connecting
 * to a real AI API through Firebase Cloud Functions for more natural conversations.
 * 
 * The assistant is designed to be:
 * - Neutral and non-partisan
 * - Educational and informative
 * - Professional and peaceful
 * - Focused on civic education and DeVote system help
 */

export const voterKnowledgeBase = [
  // ============================================
  // KENYAN CIVIC EDUCATION - IEBC
  // ============================================
  {
    id: "iebc_explanation",
    keywords: ["iebc", "independent electoral", "electoral commission", "boundaries commission", "what is iebc"],
    response: "IEBC means the Independent Electoral and Boundaries Commission. It is the constitutional body responsible for conducting and supervising elections and referenda in Kenya.\n\nIEBC's key responsibilities include:\n• Registering voters and maintaining the voter register\n• Conducting elections and referenda\n• Supervising polling stations and managing election officials\n• Verifying candidates according to election rules\n• Overseeing vote counting and results transmission\n• Announcing official results\n• Reviewing electoral boundaries\n• Promoting voter education and fair, transparent, credible elections"
  },
  {
    id: "iebc_roles",
    keywords: ["iebc roles", "iebc duties", "iebc work", "iebc responsibilities", "what does iebc do"],
    response: "The IEBC performs these key functions:\n\n1. Voter Registration - Registers eligible Kenyan citizens to vote\n2. Voter Register Maintenance - Keeps an updated list of all registered voters\n3. Election Management - Organizes and runs all elections and referenda\n4. Polling Station Supervision - Manages voting locations and officials\n5. Candidate Verification - Ensures candidates meet legal requirements\n6. Vote Counting - Oversees the counting of ballots\n7. Results Transmission - Manages how results move from polling stations\n8. Results Announcement - Declares official election winners\n9. Boundary Review - Periodically reviews electoral boundaries\n10. Voter Education - Teaches citizens about their voting rights"
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - DEMOCRATIC RIGHTS
  // ============================================
  {
    id: "democratic_rights",
    keywords: ["democratic right", "voting right", "right to vote", "my rights", "citizen rights", "what are my rights", "freedom to vote"],
    response: "Every eligible Kenyan citizen has a democratic right to vote. This is a fundamental right protected by the Constitution.\n\nYour democratic rights include:\n• Right to free choice - Choose any candidate without pressure\n• Secrecy of the ballot - Your vote choice is private\n• Equality of votes - Every vote has equal value\n• Peaceful participation - Vote without fear of violence\n• Responsibility to vote wisely - Make informed decisions\n• Youth participation - Young voters have equal voice\n• Respect for other voters - Honor different political choices\n\nVoting allows citizens to choose leaders, influence public decisions, demand accountability, and participate in national development."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - ELECTION PROCESS
  // ============================================
  {
    id: "kenya_election_process",
    keywords: ["election process", "how election works", "kenyan election", "election steps", "voting process", "how to vote in kenya", "election procedure"],
    response: "The Kenyan general election process follows these steps:\n\n1. Voter Registration - Citizens register and receive voter cards\n2. Voter Verification - IEBC verifies voter identities\n3. Candidate Nomination - Political parties select candidates\n4. Campaign Period - Candidates present their manifestos\n5. Election Day Voting - Voters cast ballots at polling stations\n6. Vote Counting - Ballots are counted at each polling station\n7. Results Transmission - Results sent to tallying centers\n8. Tallying - Votes are aggregated at constituency and national levels\n9. Official Results Announcement - IEBC declares winners\n10. Election Dispute Resolution - Any disputes handled through courts\n\nThis process ensures free, fair, transparent, and peaceful elections."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - ELECTIVE POSITIONS
  // ============================================
  {
    id: "electoral_positions",
    keywords: ["elective positions", "positions", "offices", "what positions", "government positions", "elected leaders"],
    response: "Kenya has six main elective positions:\n\n1. President - Head of State and Government\n2. Governor - Head of County Government\n3. Senator - Represents county at national level\n4. Woman Representative - Represents women and special groups\n5. Member of Parliament (MP) - Represents constituency\n6. Member of County Assembly (MCA) - Represents ward\n\nEach position has specific roles and responsibilities in governing the country."
  },
  {
    id: "president_role",
    keywords: ["president", "what does president do", "president role", "president duties", "head of state"],
    response: "The President of Kenya:\n\n• Head of State and Government\n• Leads the national executive branch\n• Represents Kenya nationally and internationally\n• Commander-in-Chief of the armed forces\n• Appoints cabinet secretaries (with parliament approval)\n• Signs bills into law or returns them to parliament\n• Responsible for national security and foreign policy\n• Elected by all registered voters nationwide\n• Serves a maximum of two 5-year terms"
  },
  {
    id: "governor_role",
    keywords: ["governor", "what does governor do", "governor role", "governor duties", "county leader"],
    response: "A Governor:\n\n• Leads a county government\n• Manages county development and services\n• Head of the county executive committee\n• Responsible for county-level services like:\n  - County health facilities\n  - County roads and infrastructure\n  - Local markets and trade\n  - County planning and development\n• Implements county budgets and policies\n• Elected by voters in that county\n• Serves a maximum of two 5-year terms"
  },
  {
    id: "senator_role",
    keywords: ["senator", "what does senator do", "senator role", "senator duties", "senate"],
    response: "A Senator:\n\n• Represents county interests at the national level\n• Participates in lawmaking concerning counties\n• Provides oversight over county governments\n• Protects devolution and county autonomy\n• Reviews and approves national revenue allocation to counties\n• Part of the Senate (upper house of Parliament)\n• Elected by voters in that county\n• Works to ensure counties get their fair share of resources"
  },
  {
    id: "woman_representative_role",
    keywords: ["woman representative", "what does woman rep do", "woman rep role", "special interest", "affirmative action"],
    response: "A Woman Representative:\n\n• Represents women in the National Assembly\n• Also represents youth, persons with disabilities, and other special interest groups\n• Participates in national lawmaking\n• Advocates for policies affecting women and marginalized groups\n• Provides oversight on gender-related issues\n• Ensures affirmative action principles are upheld\n• Elected by voters in that county\n• Part of the National Assembly (lower house of Parliament)"
  },
  {
    id: "mp_role",
    keywords: ["mp", "member of parliament", "what does mp do", "constituency representative", "national assembly"],
    response: "A Member of Parliament (MP):\n\n• Represents a constituency in the National Assembly\n• Makes national laws\n• Represents citizens' interests in parliament\n• Oversees government spending and performance\n• Approves national budgets and taxation\n• Questions cabinet secretaries on government performance\n• Elected by voters in that constituency\n• Key role in holding the executive accountable"
  },
  {
    id: "mca_role",
    keywords: ["mca", "county assembly", "what does mca do", "ward representative", "county assembly member"],
    response: "A Member of County Assembly (MCA):\n\n• Represents a ward in the County Assembly\n• Participates in county legislation\n• Provides oversight over county executive\n• Approves county budgets and development plans\n• Represents local community interests\n• Monitors county service delivery\n• Elected by voters in that ward\n• Key role in ensuring county resources benefit local communities"
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - VOTING IMPORTANCE
  // ============================================
  {
    id: "voting_importance",
    keywords: ["why vote", "importance of voting", "should i vote", "vote importance", "why should i vote", "benefits of voting"],
    response: "Voting is one of the most important ways to participate in democracy:\n\n• Your Voice - Voting gives citizens a direct say in who leads them\n• Leaders Make Decisions - Elected leaders decide on education, health, jobs, infrastructure, security, and public services\n• Accountability - Voting holds leaders accountable for their performance\n• Strengthens Democracy - High voter participation makes democracy stronger\n• Youth Participation Matters - Young voters shape the country's future\n• Peaceful Change - Voting allows peaceful transfer of power\n• Protects Rights - Elected leaders make laws that affect your rights\n\nEvery vote counts. Your single vote, combined with others, determines the leadership of the country."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - VOTE SECRECY
  // ============================================
  {
    id: "vote_secrecy",
    keywords: ["vote secrecy", "secret ballot", "private vote", "vote privacy", "who did you vote for", "reveal vote"],
    response: "Your vote is private and secret:\n\n• Voting is private - No one can force you to reveal your choice\n• Secret ballot - The voting system protects your choice\n• No pressure - You should not be pressured to vote for anyone\n• Don't sell votes - Selling your vote undermines democracy\n• Secure systems - Technology like DeVote protects voter privacy\n• DeVote doesn't ask - This system will never ask who you support before voting\n\nYour vote choice is your personal democratic decision. You have the right to keep it secret."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - ELECTION INTEGRITY
  // ============================================
  {
    id: "election_integrity",
    keywords: ["election integrity", "credible election", "fair election", "transparent election", "election trust"],
    response: "Election integrity means elections are free, fair, and trustworthy:\n\nKey elements of election integrity:\n• Transparency - Processes are open to observation\n• Fairness - All candidates have equal opportunity\n• Accuracy - Votes are counted correctly\n• Peace - Elections happen without violence\n• Trust - Citizens believe in the results\n\nWhat voters should avoid:\n• Bribery - Don't accept money or gifts for votes\n• Intimidation - Don't threaten or be threatened\n• Fake news - Don't spread false election information\n• Violence - Reject all forms of election violence\n\nTechnology like blockchain can help improve accountability when used responsibly."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - BLOCKCHAIN ELECTIONS
  // ============================================
  {
    id: "blockchain_elections",
    keywords: ["blockchain election", "blockchain voting", "blockchain and election", "how blockchain helps", "blockchain transparency"],
    response: "Blockchain technology can improve election transparency:\n\nHow blockchain helps:\n• Transparency - Vote records are visible and verifiable\n• Immutability - Valid votes recorded cannot be secretly changed\n• Auditability - Anyone can verify the vote count\n• Security - Cryptographic protection prevents tampering\n\nIn DeVote:\n• Firebase handles voter registration data\n• Blockchain protects vote records\n• Votes are transparent but voter identity is protected\n\nImportant: Blockchain does not replace IEBC. DeVote demonstrates a technology model for transparent elections using blockchain principles."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - FAKE NEWS AWARENESS
  // ============================================
  {
    id: "fake_news_awareness",
    keywords: ["fake news", "misinformation", "false information", "election rumors", "verify information", "fake results"],
    response: "Protect yourself from election misinformation:\n\n• Verify before sharing - Check information from multiple trusted sources\n• Election misinformation creates fear - False claims can cause unnecessary panic or conflict\n• Use official sources - Rely on IEBC and other official channels for election information\n• Avoid spreading unconfirmed results - Wait for official announcements\n• Watch for manipulated content - Images and videos can be edited or taken out of context\n• Check dates and sources - Old news may be recirculated to mislead\n\nBe a responsible digital citizen. Misinformation can harm the electoral process and create conflict."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - PEACEFUL ELECTIONS
  // ============================================
  {
    id: "peaceful_elections",
    keywords: ["peaceful election", "election peace", "election violence", "peace during election", "reject violence"],
    response: "Peaceful elections are essential for democracy:\n\nHow to promote peaceful elections:\n• Participate peacefully - Vote without violence or intimidation\n• Respect other people's choices - Not everyone will support your candidate\n• Reject violence - Don't participate in or support violent acts\n• Legal dispute resolution - Use courts and legal processes for election disputes\n• Report incidents - Report any violence or intimidation to authorities\n• Be a voice for peace - Encourage others to remain peaceful\n\nElections are about ideas and policies, not violence. Disagreements should be resolved through lawful institutions."
  },

  // ============================================
  // KENYAN CIVIC EDUCATION - WHO CAN VOTE
  // ============================================
  {
    id: "who_can_vote",
    keywords: ["who can vote", "eligible voter", "voter eligibility", "can i vote", "voting requirements", "voter qualification"],
    response: "In Kenya, to be eligible to vote you must be:\n\n• An eligible Kenyan citizen\n• At least 18 years old\n• A registered voter with a voter's card\n• Your details must be verified in the voter register\n• Assigned to a correct polling location\n\nIn DeVote specifically:\n• Only admin-approved wallet-linked voters can vote\n• Your wallet address must match your registered details\n• You must be connected to the Sepolia test network\n• You can only vote once per position\n\nVoting is both a right and a responsibility. Make sure you're registered and ready to participate."
  },

  // ============================================
  // SAFETY & NEUTRALITY - POLITICAL NEUTRALITY
  // ============================================
  {
    id: "political_neutrality",
    keywords: ["who should i vote for", "which party", "which candidate", "best party", "best candidate", "vote for", "support candidate", "which tribe", "tribe should lead", "predict winner", "who will win", "manipulate election", "rig election", "party support"],
    response: "I can provide civic education and explain the voting process, but I cannot support or oppose any candidate, party, tribe, or political group.\n\nYour vote is your personal democratic choice. I'm here to help you understand:\n• How to register and vote\n• Your democratic rights\n• The election process\n• The roles of different positions\n• How to vote safely and securely\n\nMake your decision based on your own values, the candidates' policies, and what you believe is best for your community and country."
  },

  // ============================================
  // DEVOTE HELP - REGISTRATION
  // ============================================
  {
    id: "registration_process",
    keywords: ["register", "registration", "sign up", "voter account", "how to register", "create account"],
    response: "To register as a voter in DeVote:\n\n1. Navigate to the Voter Registration page\n2. Enter your full name, ID number, and wallet address\n3. Select your county, constituency, and ward\n4. Upload required verification documents (ID photo and selfie)\n5. Set a secure PIN\n6. Submit your registration\n\nYour registration will be reviewed by an administrator. Once approved, you'll be eligible to vote. You can check your registration status on the registration page."
  },
  {
    id: "registration_requirements",
    keywords: ["what do i need", "requirements", "documents", "id", "selfie", "verification"],
    response: "Registration requirements:\n\n• Valid government ID number\n• Clear photo of your ID document\n• A selfie for identity verification\n• A valid Ethereum wallet address (MetaMask)\n• Your location details (county, constituency, ward)\n• A secure PIN for your account\n\nAll documents must be clear and legible for approval."
  },
  {
    id: "registration_approval",
    keywords: ["approval", "pending", "waiting", "how long", "when approved", "admin review"],
    response: "After submitting your registration:\n\n• Your application enters a review queue\n• An administrator verifies your identity documents\n• This process typically takes 24-48 hours\n• You'll receive notification once approved\n• You can check your status on the registration page\n\nIf your registration is rejected, you'll receive feedback on what needs to be corrected."
  },
  
  // ============================================
  // DEVOTE HELP - METAMASK & WALLET CONNECTION
  // ============================================
  {
    id: "metamask_desktop",
    keywords: ["metamask", "wallet", "connect wallet", "desktop", "extension", "browser"],
    response: "To connect MetaMask on desktop:\n\n1. Install the MetaMask browser extension from metamask.io\n2. Create or import your wallet\n3. Ensure you're on the Sepolia test network\n4. Click 'Connect MetaMask' on the voting platform\n5. Approve the connection request in MetaMask\n\nOnce connected, your wallet address will be displayed in the top navigation."
  },
  {
    id: "metamask_android",
    keywords: ["android", "phone", "mobile", "not detected", "doesn't work", "can't connect"],
    response: "For Android/Mobile users:\n\nImportant: MetaMask on mobile works differently than desktop.\n\n1. Download the MetaMask app from Google Play Store\n2. Create or import your wallet in the app\n3. Open the MetaMask app and go to the browser (dApp browser)\n4. Enter the DeVote website URL INSIDE the MetaMask browser\n5. The site will now detect your wallet\n6. Click 'Connect MetaMask' when prompted\n\nImportant: Do NOT try to use Chrome or other browsers directly - they won't detect MetaMask. You MUST use the in-app browser."
  },
  {
    id: "sepolia_network",
    keywords: ["sepolia", "network", "testnet", "wrong network", "switch network"],
    response: "The DeVote system runs on the Sepolia test network:\n\n• Make sure MetaMask is set to 'Sepolia' network\n• If you're on Ethereum Mainnet or another network, you'll need to switch\n• MetaMask should prompt you to switch automatically when connecting\n• You can manually switch by clicking the network dropdown in MetaMask\n• If you don't see Sepolia, add it manually:\n  - Network Name: Sepolia\n  - RPC URL: https://sepolia.infura.io/v3/YOUR_KEY\n  - Chain ID: 11155111\n  - Currency Symbol: ETH"
  },
  {
    id: "wallet_not_detected",
    keywords: ["not detected", "wallet not found", "no wallet", "cannot find", "error connecting"],
    response: "If your wallet is not being detected:\n\nDesktop:\n• Ensure MetaMask extension is installed and unlocked\n• Refresh the page\n• Try disconnecting and reconnecting\n\nMobile:\n• You MUST use the MetaMask in-app browser\n• Open MetaMask app → Browser → Enter website URL\n• Do not use Chrome/Safari directly\n\nGeneral:\n• Clear browser cache and cookies\n• Try a different browser\n• Ensure JavaScript is enabled"
  },
  
  // ============================================
  // DEVOTE HELP - ELIGIBILITY
  // ============================================
  {
    id: "eligibility_requirements",
    keywords: ["eligible", "eligibility", "can i vote", "allowed to vote", "not eligible", "ineligible"],
    response: "To be eligible to vote in DeVote, you must:\n\n Be a registered voter in the system\n Have your registration approved by an admin\n Have your wallet address match the approved registration\n Be connected to the correct network (Sepolia)\n Be voting during the active election period\n Not have already voted in this election\n\nIf you meet all these criteria but still can't vote, please contact support."
  },
  {
    id: "not_eligible_reasons",
    keywords: ["why can't i vote", "why not eligible", "rejected", "denied", "cannot vote"],
    response: "Common reasons for ineligibility:\n\n1. Registration not yet approved - Check your registration status\n2. Wallet address mismatch - Your connected wallet must match your registered address\n3. Election not active - Voting is only open during the election period\n4. Already voted - Each voter can only vote once per position\n5. Network issues - Ensure you're on Sepolia testnet\n6. Registration rejected - Your documents may have been rejected\n\nCheck your voter dashboard for specific status information."
  },
  
  // ============================================
  // DEVOTE HELP - VOTING PROCESS
  // ============================================
  {
    id: "how_to_vote",
    keywords: ["how to vote", "cast vote", "voting process", "vote for", "select candidate"],
    response: "How to cast your vote in DeVote:\n\n1. Ensure you're connected to MetaMask\n2. Navigate to the Voting page\n3. Select the position you want to vote for (President, Governor, etc.)\n4. View the list of candidates for that position\n5. Click on your preferred candidate\n6. Review your selection carefully\n7. Click 'Vote' button\n8. Confirm the transaction in MetaMask\n9. Wait for blockchain confirmation (usually 15-30 seconds)\n10. You'll see a success message once your vote is recorded\n\nImportant: You can only vote once per position. Choose carefully!"
  },
  {
    id: "voting_positions",
    keywords: ["positions", "offices", "president", "governor", "senator", "mp", "candidate"],
    response: "The DeVote system supports multiple elective positions:\n\n• President\n• Governor\n• Senator\n• Member of Parliament (MP)\n• Woman Representative\n• County Assembly Member (MCA)\n\nYou can vote for one candidate per position. The candidates you see may be filtered based on your registered location (county, constituency, ward)."
  },
  {
    id: "vote_confirmation",
    keywords: ["confirm", "confirmation", "transaction", "pending", "waiting"],
    response: "After you submit your vote:\n\n1. MetaMask will show a transaction confirmation popup\n2. Review the gas fees and click 'Confirm'\n3. Wait for the blockchain to process the transaction (15-30 seconds)\n4. You'll see a success message with a transaction hash\n5. You can view your transaction on Etherscan using the hash\n\nIf the transaction fails, it may be due to:\n• Network congestion (try again with higher gas)\n• You've already voted\n• Your eligibility changed\n• Network connection issues"
  },
  
  // ============================================
  // DEVOTE HELP - ALREADY VOTED
  // ============================================
  {
    id: "already_voted",
    keywords: ["already voted", "cannot vote", "voted already", "duplicate", "second time"],
    response: "If you see 'Already Voted':\n\nThis means you have already cast your vote for this position. The blockchain voting system allows only ONE vote per eligible voter per position. This is a security feature to prevent fraud.\n\n• You cannot vote again for the same position\n• Your vote has been permanently recorded on the blockchain\n• You can verify your vote using the transaction hash\n• If you believe this is an error, contact support with your wallet address\n\nRemember: Blockchain votes are immutable and cannot be changed or deleted."
  },
  
  // ============================================
  // DEVOTE HELP - VOTE VERIFICATION
  // ============================================
  {
    id: "verify_vote",
    keywords: ["verify", "verification", "check vote", "my vote", "transaction hash", "etherscan"],
    response: "To verify your vote:\n\n1. After voting, you receive a transaction hash\n2. Copy this hash\n3. Go to a block explorer like Etherscan (sepolia.etherscan.io)\n4. Paste the hash in the search bar\n5. You'll see your transaction details including:\n   - Block number\n   - Timestamp\n   - Your wallet address\n   - The candidate you voted for\n\nThis proves your vote was recorded on the blockchain and cannot be altered."
  },
  {
    id: "vote_receipt",
    keywords: ["receipt", "proof", "evidence", "confirmation"],
    response: "Your vote receipt includes:\n\n• Transaction Hash - Unique identifier on blockchain\n• Block Number - Which block contains your vote\n• Timestamp - When your vote was recorded\n• Candidate - Who you voted for\n• Position - Which office this vote was for\n\nSave your transaction hash as proof of voting. This is your receipt that your vote was counted."
  },
  
  // ============================================
  // DEVOTE HELP - ELECTION STATUS
  // ============================================
  {
    id: "election_phases",
    keywords: ["election status", "when voting", "voting period", "election timeline", "phases"],
    response: "Election phases:\n\n1. Registration Phase:\n   - Voters can register\n   - Admin reviews applications\n   - Candidates can be added\n\n2. Voting Phase:\n   - Active voting period\n   - Eligible voters can cast ballots\n   - Results may be visible in real-time\n\n3. Ended Phase:\n   - Voting has closed\n   - Final results are calculated\n   - Winners are announced\n\nCheck the election dashboard for current status and timing."
  },
  {
    id: "election_ended",
    keywords: ["ended", "closed", "over", "finished", "voting closed"],
    response: "If the election has ended:\n\n• Voting is no longer possible\n• You can view the final results on the Results page\n• Winners are displayed for each position\n• Vote counts and percentages are shown\n• All results are permanently recorded on the blockchain\n\nIf you didn't vote before the deadline, you'll need to wait for the next election."
  },
  
  // ============================================
  // DEVOTE HELP - RESULTS
  // ============================================
  {
    id: "view_results",
    keywords: ["results", "winners", "who won", "vote count", "tally"],
    response: "To view election results:\n\n1. Navigate to the Results page\n2. Results are organized by position\n3. You'll see:\n   - Each candidate's vote count\n   - Percentage of total votes\n   - Visual charts/graphs\n   - Winner announcement (after election ends)\n\nResults update in real-time during the voting phase and are finalized when the election ends. All results are stored on the blockchain for transparency."
  },
  {
    id: "live_results",
    keywords: ["live", "real-time", "current", "updating", "refresh"],
    response: "Live results during voting:\n\n• Results update automatically as votes are cast\n• The system refreshes every few seconds\n• You can see current standings\n• Percentages change in real-time\n• Final results are locked when election ends\n\nNote: Live results are visible to all users during the voting phase to maintain transparency."
  },
  
  // ============================================
  // DEVOTE HELP - BLOCKCHAIN SECURITY
  // ============================================
  {
    id: "blockchain_security",
    keywords: ["blockchain", "secure", "security", "tamper", "hack", "safe", "trust"],
    response: "How blockchain secures your vote:\n\n Immutability - Once recorded, votes cannot be changed\n Transparency - All votes are publicly verifiable on the blockchain\n Decentralization - No single point of failure or control\n Cryptographic Security - Votes are protected by advanced cryptography\n Audit Trail - Complete transaction history is maintained\n Anonymity - Your vote is linked to your wallet, not your identity\n\nThe blockchain ensures that:\n• Admins cannot alter votes\n• Votes cannot be deleted\n• Results are mathematically verifiable\n• The election is transparent and trustworthy"
  },
  {
    id: "privacy_protection",
    keywords: ["privacy", "anonymous", "personal information", "data", "identity"],
    response: "Your privacy is protected:\n\n• Your vote is linked to your wallet address, not your personal identity\n• Registration documents (ID, selfie) are only visible to admins for verification\n• Your vote choice is recorded on blockchain but not publicly linked to your identity\n• Personal data is stored securely in Firebase with restricted access\n• The system follows data protection best practices\n\nNever share your MetaMask seed phrase or private key with anyone. DeVote will never ask for this information."
  },
  
  // ============================================
  // DEVOTE HELP - SECURITY WARNINGS
  // ============================================
  {
    id: "seed_phrase_warning",
    keywords: ["seed phrase", "private key", "recovery phrase", "password", "secret"],
    response: "SECURITY WARNING\n\nNEVER share your:\n• MetaMask seed phrase (12-24 words)\n• Private key\n• Password\n• Recovery phrase\n\nDeVote will NEVER ask for this information. Anyone requesting these details is trying to steal your wallet and funds.\n\nKeep your seed phrase offline and secure. If someone has your seed phrase, they have complete control over your wallet."
  },
  {
    id: "scam_warning",
    keywords: ["scam", "fake", "phishing", "suspicious", "fraud"],
    response: "SCAM ALERT\n\nBe aware of:\n• Fake websites that look like DeVote\n• Messages asking for your seed phrase\n• Emails claiming to be from DeVote support asking for personal info\n• Anyone offering to help you vote for a fee\n• Links in social media claiming to be voting portals\n\nAlways verify you're on the official DeVote website. Check the URL carefully. DeVote will never contact you asking for private information."
  },
  
  // ============================================
  // DEVOTE HELP - TECHNICAL SUPPORT
  // ============================================
  {
    id: "gas_fees",
    keywords: ["gas", "fee", "transaction fee", "eth", "cost"],
    response: "About gas fees:\n\n• Voting on blockchain requires gas fees (paid in ETH)\n• Fees go to blockchain validators, not to DeVote\n• Fees vary based on network congestion\n• Typical voting transaction: $1-5 on Sepolia testnet\n• MetaMask will show the fee before you confirm\n\nOn testnet (Sepolia), you can get free test ETH from faucets if needed."
  },
  {
    id: "transaction_failed",
    keywords: ["failed", "error", "rejected", "declined", "transaction failed"],
    response: "If your transaction failed:\n\nPossible reasons:\n• Insufficient ETH for gas fees\n• Network congestion (try with higher gas)\n• You've already voted for this position\n• Your eligibility changed\n• Wallet disconnected during transaction\n• Smart contract rejected the transaction\n\nWhat to do:\n1. Check your MetaMask for error details\n2. Verify you're on Sepolia network\n3. Ensure you have enough test ETH\n4. Try again with higher gas limit\n5. Refresh the page and reconnect wallet"
  },
  {
    id: "netlify_blank_page",
    keywords: ["blank page", "white screen", "netlify", "not loading", "page empty"],
    response: "If you see a blank/white page on Netlify:\n\n1. Clear your browser cache and cookies\n2. Try a different browser\n3. Check if JavaScript is enabled\n4. Verify you're using the correct URL\n5. Check Netlify status for any outages\n6. Try accessing from a different device\n\nIf the issue persists, contact the development team with details about your browser and device."
  },
  {
    id: "admin_detection_help",
    keywords: ["admin", "administrator", "admin panel", "admin access", "cannot access admin"],
    response: "Admin access in DeVote:\n\n• Admins have special privileges to manage elections\n• Admin panel is accessible only to approved admin wallets\n• If you're an admin but can't access the panel, ensure:\n  - Your wallet is connected\n  - Your wallet is registered as an admin\n  - You're on the correct network\n\nAdmins can:\n• Approve/reject voter registrations\n• Add/remove candidates\n• Start/end elections\n• View detailed analytics\n• Manage election settings"
  },
  
  // ============================================
  // DEVOTE HELP - GENERAL HELP
  // ============================================
  {
    id: "getting_started",
    keywords: ["help", "guide", "tutorial", "how to", "getting started", "beginner"],
    response: "Getting started with DeVote:\n\n1. Install MetaMask browser extension or mobile app\n2. Create/import your wallet and switch to Sepolia testnet\n3. Register as a voter with your details and ID verification\n4. Wait for admin approval (24-48 hours)\n5. Once approved, connect your wallet during election period\n6. Navigate to Voting page and cast your vote\n7. Verify your vote using the transaction hash\n\nNeed more help? Ask me specific questions about any of these steps!"
  },
  {
    id: "faq",
    keywords: ["faq", "frequently asked questions", "common questions", "popular"],
    response: "Frequently Asked Questions:\n\nQ: Can I vote more than once?\nA: No, one vote per position per voter.\n\nQ: Can I change my vote?\nA: No, blockchain votes are permanent.\n\nQ: Is my vote anonymous?\nA: Yes, linked to wallet not identity.\n\nQ: How do I know my vote counted?\nA: Verify using transaction hash on Etherscan.\n\nQ: What if I lose access to my wallet?\nA: You'll need to recover it using your seed phrase.\n\nQ: Can I vote from my phone?\nA: Yes, but MUST use MetaMask in-app browser.\n\nAsk me about any specific topic for more details!"
  }
];

/**
 * Fallback response when no match is found
 */
export const fallbackResponse = "I'm not fully sure about that yet. You can ask me about:\n\n• Registration process\n• MetaMask connection\n• Voting eligibility\n• How to cast your vote\n• Already Voted status\n• Vote verification\n• Election results\n• Blockchain security\n• IEBC and Kenyan elections\n• Democratic rights\n• Elective positions\n\nTry rephrasing your question or choose from the suggested questions below.";

/**
 * Contextual responses based on app state
 */
export const contextualResponses = {
  walletNotConnected: "It looks like your wallet is not connected. Please connect MetaMask first before proceeding with any voting activities.",
  electionNotStarted: "The election has not started yet. You can register as a voter and prepare, but voting will only be possible once the election begins.",
  electionEnded: "Voting has ended. You can now check the final results on the Results page to see who won.",
  alreadyVoted: "You have already cast your vote. You cannot vote again, but you can verify your vote using the transaction hash.",
  notEligible: "You are currently not eligible to vote. This could be because your registration is pending approval, your wallet doesn't match your registered address, or the election is not active.",
  adminUser: "As an administrator, you have additional capabilities including managing voters, candidates, and election settings."
};

/**
 * Check for political persuasion questions and return neutral response
 */
const isPoliticalPersuasion = (input) => {
  const lowerInput = input.toLowerCase();
  const politicalPatterns = [
    /who\s+should\s+i\s+vote\s+for/i,
    /which\s+party\s+(is\s+)?best/i,
    /which\s+candidate\s+(is\s+)?best/i,
    /which\s+tribe\s+should/i,
    /predict\s+winner/i,
    /who\s+will\s+win/i,
    /manipulate\s+election/i,
    /rig\s+election/i,
    /help\s+me\s+vote\s+for/i,
    /support\s+(this|that|my)\s+(candidate|party)/i,
    /oppose\s+(this|that|my)\s+(candidate|party)/i,
    /\w+\s+should\s+win/i,
    /\w+\s+must\s+win/i,
  ];
  
  for (const pattern of politicalPatterns) {
    if (pattern.test(lowerInput)) {
      return true;
    }
  }
  return false;
};

/**
 * Match user input against knowledge base
 * @param {string} input - User's question/message
 * @param {object} appState - Current application state
 * @returns {string} - Best matching response
 */
export const getResponse = (input, appState = {}) => {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for political persuasion questions first (neutrality)
  if (isPoliticalPersuasion(input)) {
    return voterKnowledgeBase.find(k => k.id === 'political_neutrality').response;
  }
  
  // Check for security-sensitive queries first
  if (lowerInput.includes('seed phrase') || lowerInput.includes('private key') || 
      lowerInput.includes('recovery phrase') || lowerInput.includes('password')) {
    return voterKnowledgeBase.find(k => k.id === 'seed_phrase_warning').response;
  }
  
  // Check for contextual responses based on app state
  if (appState && !appState.isWalletConnected && 
      (lowerInput.includes('vote') || lowerInput.includes('connect') || 
       lowerInput.includes('register') || lowerInput.includes('how to'))) {
    return contextualResponses.walletNotConnected;
  }
  
  if (appState?.electionEnded && lowerInput.includes('vote')) {
    return contextualResponses.electionEnded;
  }
  
  if (appState?.hasVoted && lowerInput.includes('vote')) {
    return contextualResponses.alreadyVoted;
  }
  
  // Find best matching knowledge item
  let bestMatch = null;
  let bestScore = 0;
  
  for (const knowledge of voterKnowledgeBase) {
    // Skip political neutrality entry in normal matching (handled above)
    if (knowledge.id === 'political_neutrality') continue;
    
    let score = 0;
    
    for (const keyword of knowledge.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Exact phrase match (highest score)
      if (lowerInput.includes(lowerKeyword)) {
        score += 3;
      }
      
      // Word match (medium score)
      const keywordWords = lowerKeyword.split(' ');
      for (const word of keywordWords) {
        if (word.length > 2 && lowerInput.includes(word)) {
          score += 1;
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = knowledge;
    }
  }
  
  // Return matched response or fallback
  if (bestMatch && bestScore >= 2) {
    return bestMatch.response;
  }
  
  return fallbackResponse;
};

/**
 * Get suggested questions organized by category
 * @param {object} appState - Current application state
 * @returns {object} - Object with category names as keys and question arrays as values
 */
export const getSuggestedQuestionsByCategory = (appState = {}) => {
  const categories = {
    "DeVote Help": [
      "How do I register as a voter?",
      "How do I connect MetaMask?",
      "How do I cast my vote?",
      "How do I verify my vote?",
      "MetaMask not detected on Android"
    ],
    "Civic Education": [
      "Why should I vote?",
      "What are my democratic rights?",
      "What is vote secrecy?",
      "Why are peaceful elections important?",
      "How do I avoid fake news?"
    ],
    "IEBC & Elections": [
      "What is IEBC?",
      "What does IEBC do?",
      "How do Kenyan elections work?",
      "What is election integrity?",
      "Who can vote?"
    ],
    "Elective Positions": [
      "What does a President do?",
      "What does a Governor do?",
      "What does a Senator do?",
      "What does an MP do?",
      "What does an MCA do?"
    ],
    "Blockchain & Integrity": [
      "What is blockchain voting?",
      "How does blockchain secure my vote?",
      "What is election integrity?",
      "How do I verify my vote?"
    ],
    "Troubleshooting": [
      "Why am I not eligible?",
      "Transaction failed",
      "Blank page on Netlify",
      "Wallet not detected"
    ]
  };
  
  // Add contextual suggestions based on state
  if (!appState.isWalletConnected) {
    if (!categories["Troubleshooting"].includes("How do I connect MetaMask?")) {
      categories["Troubleshooting"].unshift("How do I connect MetaMask?");
    }
  }
  
  if (appState.electionEnded) {
    if (!categories["DeVote Help"].includes("How do I view election results?")) {
      categories["DeVote Help"].unshift("How do I view election results?");
    }
  }
  
  if (appState.hasVoted) {
    if (!categories["DeVote Help"].includes("How do I verify my vote?")) {
      categories["DeVote Help"].unshift("How do I verify my vote?");
    }
  }
  
  if (!appState.isEligible) {
    if (!categories["Troubleshooting"].includes("Why am I not eligible?")) {
      categories["Troubleshooting"].unshift("Why am I not eligible?");
    }
  }
  
  return categories;
};

/**
 * Get flat list of suggested questions (for backward compatibility)
 * @param {object} appState - Current application state
 * @returns {string[]} - Array of suggested questions
 */
export const getSuggestedQuestions = (appState = {}) => {
  const categories = getSuggestedQuestionsByCategory(appState);
  const allQuestions = [];
  
  // Get top questions from each category
  for (const categoryQuestions of Object.values(categories)) {
    allQuestions.push(...categoryQuestions.slice(0, 2));
  }
  
  return allQuestions.slice(0, 8);
};