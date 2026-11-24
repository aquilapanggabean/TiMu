# TIMU Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Blind Discovery Invariant**: `talent_public/{userId}` NEVER stores `fullName`, `avatarUrl`, `email`, or `phonePrivate`. `talent_identities/{userId}` is strictly unreadable unless `request.auth.uid == userId` OR `exists(/databases/$(database)/documents/talent_unlocks/$(request.auth.uid + '_' + userId))`.
2. **PII Isolation Invariant**: `users/{userId}/private/{docId}` is strictly readable and writable ONLY by `request.auth.uid == userId`.
3. **Token Ledger & Unlock Atomicity**: Creating `talent_unlocks/{employerId}_{talentId}` requires `employerId == request.auth.uid`, `tokensSpent == 1`, and atomic verification that the employer profile exists.
4. **Top 3 Skills Boundary**: `talent_public.topSkills` MUST be a list of length 3 (`size() == 3`) when `firstQuestCompleted == true` and at most 3 otherwise.
5. **Terminal Contract Locking**: Once `contracts/{contractId}.escrowStatus == 'released'`, no further mutations are permitted on the contract.
6. **Public Certificate Verification without Enumeration**: `certificates/{verificationCode}` permits `allow get: if isValidId(verificationCode)` so public verification URLs `/verify/[code]` work without login, while `allow list` is restricted to `talentId == request.auth.uid || employerId == request.auth.uid` to prevent scraping.
7. **Master Gate for Chat Messages**: Subcollection `conversations/{conversationId}/messages/{messageId}` fetches the parent conversation via `get()` and confirms `request.auth.uid` is either `employerId` or `talentId`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Identity Spoofing on Opportunity Create**: Employer A attempts to create an opportunity with `employerId: "employer_B"`.
2. **Blind Identity Leak Attempt**: Employer without a `talent_unlocks/{employerId}_{talentId}` doc tries to `get` `talent_identities/{talentId}`.
3. **Private PII Access Attempt**: Authenticated non-owner attempts to read `users/{otherUid}/private/info`.
4. **Shadow Field Injection on Talent Public**: Talent includes an undeclared ghost key `isAdmin: true` in `talent_public/{uid}`.
5. **Unverified Email Write**: User with `email_verified: false` attempts to create a contract or opportunity.
6. **ID Poisoning**: Attacker writes to `opportunities/../../malicious$$id` or a 300-character document ID.
7. **Escrow Terminal State Tampering**: Employer or Talent attempts to modify `grossAmountMinor` or revert `escrowStatus` after `escrowStatus == 'released'`.
8. **Escrow Math Tampering**: Employer tries to create a contract where `platformFeeMinor + netTalentMinor != grossAmountMinor` or `grossAmountMinor <= 0`.
9. **Unauthorized Message Injection**: Third-party user tries to create a message inside `conversations/{convId}/messages/{msgId}` where they are neither `employerId` nor `talentId`.
10. **Certificate Scraping**: Anonymous or authenticated user tries to `list` all documents in `certificates` without filtering by their own `talentId` or `employerId`.
11. **Timestamp Forgery**: Client creates a `token_ledger` entry with backdated `createdAt != request.time`.
12. **Array Exhaustion**: Talent sends 50 items inside `talent_public.topSkills` or `interests`.
