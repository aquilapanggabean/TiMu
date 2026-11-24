import type { LocaleCode } from '../types/timu';

export interface Dictionary {
  brandName: string;
  brandSubtitle: string;
  nav: {
    home: string;
    dashboard: string;
    firstQuest: string;
    opportunities: string;
    chat: string;
    profile: string;
    discover: string;
    projects: string;
    billing: string;
    verify: string;
    signIn: string;
    signOut: string;
  };
  modes: {
    talent: string;
    employer: string;
    switchWorkspace: string;
  };
  common: {
    tokens: string;
    token: string;
    loading: string;
    tryAgain: string;
    cancel: string;
    confirm: string;
    save: string;
    close: string;
    resetFilters: string;
    verified: string;
    priority: string;
    remote: string;
    onsite: string;
    hybrid: string;
    demoBannerTitle: string;
    demoBannerBody: string;
    dismiss: string;
    installApp: string;
    offlineNotice: string;
    sandboxNotice: string;
  };
  gateway: {
    heroTitle: string;
    heroSubtitle: string;
    ctaTalent: string;
    ctaEmployer: string;
    previewTitle: string;
    previewSubtitle: string;
    howTitle: string;
    pricingTitle: string;
    verifyPromptTitle: string;
    verifyPlaceholder: string;
    verifyButton: string;
  };
  escrow: {
    grossBudget: string;
    platformFee: string;
    netPayout: string;
    complianceNote: string;
    pendingFunding: string;
    funded: string;
    deliverableSubmitted: string;
    released: string;
    disputed: string;
    hireAndFund: string;
    submitDeliverable: string;
    approveAndRelease: string;
  };
  discovery: {
    title: string;
    subtitle: string;
    identityHidden: string;
    skip: string;
    unlockCta: string;
    openChat: string;
    privacyNotice: string;
    revealModalTitle: string;
    revealModalBody: string;
    confirmUnlock: string;
    emptyTitle: string;
    emptyBody: string;
  };
  firstQuest: {
    title: string;
    subtitle: string;
    previewCard: string;
    completeCta: string;
    rookieUnlocked: string;
    skillsCounter: string;
  };
  opportunities: {
    title: string;
    subtitle: string;
    allTypes: string;
    escrowProject: string;
    partTimeJob: string;
    fullTimeJob: string;
    applyWithPitch: string;
    applied: string;
    shortlisted: string;
    hired: string;
    closed: string;
    publishCta: string;
  };
  certificate: {
    pageTitle: string;
    issuedBy: string;
    awardedTo: string;
    projectLabel: string;
    validatedSkills: string;
    verificationId: string;
    issuedDate: string;
    copyLink: string;
    copied: string;
    downloadPdf: string;
    authenticBanner: string;
  };
}

export const DICTIONARIES: Record<LocaleCode, Dictionary> = {
  en: {
    brandName: 'TIMU',
    brandSubtitle: 'Titik Temu',
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      firstQuest: 'First Quest',
      opportunities: 'Find Projects',
      chat: 'Chat',
      profile: 'Profile',
      discover: 'Discover Talent',
      projects: 'My Projects',
      billing: 'Profile & Tokens',
      verify: 'Verify Certificate',
      signIn: 'Sign In',
      signOut: 'Sign Out',
    },
    modes: {
      talent: 'Talent',
      employer: 'Employer (SME)',
      switchWorkspace: 'Switch workspace mode',
    },
    common: {
      tokens: 'Tokens',
      token: 'Token',
      loading: 'Loading workspace data...',
      tryAgain: 'Try Again',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save Changes',
      close: 'Close',
      resetFilters: 'Reset Filters',
      verified: 'Verified',
      priority: 'Priority',
      remote: 'Remote',
      onsite: 'On-site',
      hybrid: 'Hybrid',
      demoBannerTitle: 'Demo Workspace',
      demoBannerBody:
        'Sample records and Sandbox Payment Simulator are active so you can test every workflow end to end.',
      dismiss: 'Dismiss notice',
      installApp: 'Install App',
      offlineNotice: 'Offline mode: showing cached workspace shell.',
      sandboxNotice: 'Sandbox Payment Simulator active.',
    },
    gateway: {
      heroTitle: 'Escrow-protected work where skills speak before names.',
      heroSubtitle:
        'TIMU connects small and medium businesses with emerging talent through blind skill-first discovery, third-party Escrow milestones, and verifiable completion certificates.',
      ctaTalent: 'Start First Quest',
      ctaEmployer: 'Browse Blind Talent',
      previewTitle: 'Blind Discovery meets transparent Escrow',
      previewSubtitle:
        'Evaluate verified skills, education, and work readiness before spending 1 Token to reveal identity and open protected Escrow chat.',
      howTitle: 'Built for two-sided trust',
      pricingTitle: 'Clear, predictable pricing',
      verifyPromptTitle: 'Verify a TIMU Completion Certificate',
      verifyPlaceholder: 'Enter code, e.g. TIMU-2026-A84K2P',
      verifyButton: 'Verify Code',
    },
    escrow: {
      grossBudget: 'Project Budget (100%)',
      platformFee: 'Platform Admin Fee (10%)',
      netPayout: 'Net Talent Payout (90%)',
      complianceNote:
        'Funds are held by a licensed third-party Payment Service Provider (or Sandbox Payment Simulator in preview mode), never in a personal bank account.',
      pendingFunding: 'Pending Funding',
      funded: 'Funds Protected in Escrow',
      deliverableSubmitted: 'Deliverable Submitted',
      released: 'Released',
      disputed: 'In Review',
      hireAndFund: 'Hire & Fund Escrow',
      submitDeliverable: 'Submit Deliverable',
      approveAndRelease: 'Approve & Release Escrow',
    },
    discovery: {
      title: 'Discover Blind Talent',
      subtitle: 'Review verified skills, education, and location or timezone fit before revealing identity.',
      identityHidden: 'Identity hidden until unlocked',
      skip: 'Skip',
      unlockCta: 'Unlock Chat & Hire (1 Token)',
      openChat: 'Open Chat',
      privacyNotice: 'Direct WhatsApp or phone numbers are only shared if the talent opts in inside chat.',
      revealModalTitle: 'Unlock Chat & Hire with 1 Token',
      revealModalBody:
        'Spending 1 Token reveals full identity, opens persistent real-time chat, and activates Escrow hiring. Project Escrow funding is separate and carries a transparent 10% Platform Admin Fee at release.',
      confirmUnlock: 'Unlock Chat & Hire (1 Token)',
      emptyTitle: 'No matching candidates left in this view',
      emptyBody: 'Reset your filters or reload skipped profiles to keep browsing talent.',
    },
    firstQuest: {
      title: 'First Quest Onboarding',
      subtitle: 'Complete all 6 missions to earn 100 EXP, reach Level 1, and publish your blind discovery card.',
      previewCard: 'Preview My Card',
      completeCta: 'Finish Quest & Reach Level 1',
      rookieUnlocked: 'Level 1 Active',
      skillsCounter: 'Top 3 Skills',
    },
    opportunities: {
      title: 'Find Projects',
      subtitle: 'Apply to Escrow-protected projects or part-time and full-time jobs from local and remote SMEs.',
      allTypes: 'All Projects',
      escrowProject: 'Escrow Projects',
      partTimeJob: 'Part-Time Job',
      fullTimeJob: 'Full-Time Job',
      applyWithPitch: 'Apply to Project',
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      hired: 'Hired',
      closed: 'Closed',
      publishCta: 'Post a Project (1 Token)',
    },
    certificate: {
      pageTitle: 'Verifiable Completion Certificate',
      issuedBy: 'Issuing Business (SME)',
      awardedTo: 'Awarded To',
      projectLabel: 'Completed Escrow Project',
      validatedSkills: 'Validated Skill Badges',
      verificationId: 'Verification ID',
      issuedDate: 'Issue Date',
      copyLink: 'Copy Verification Link',
      copied: 'Link Copied',
      downloadPdf: 'Download / Print PDF',
      authenticBanner: 'Verified authentic TIMU Escrow completion record.',
    },
  },
  id: {
    brandName: 'TIMU',
    brandSubtitle: 'Titik Temu',
    nav: {
      home: 'Beranda',
      dashboard: 'Beranda',
      firstQuest: 'First Quest',
      opportunities: 'Cari Proyek',
      chat: 'Chat',
      profile: 'Profil',
      discover: 'Cari Talenta',
      projects: 'Proyek Saya',
      billing: 'Profil & Token',
      verify: 'Verifikasi Sertifikat',
      signIn: 'Masuk',
      signOut: 'Keluar',
    },
    modes: {
      talent: 'Talenta',
      employer: 'UMKM',
      switchWorkspace: 'Ganti mode ruang kerja',
    },
    common: {
      tokens: 'Token',
      token: 'Token',
      loading: 'Memuat data ruang kerja...',
      tryAgain: 'Coba Lagi',
      cancel: 'Batal',
      confirm: 'Konfirmasi',
      save: 'Simpan Perubahan',
      close: 'Tutup',
      resetFilters: 'Atur Ulang Filter',
      verified: 'Terverifikasi',
      priority: 'Prioritas',
      remote: 'Remote',
      onsite: 'Di Lokasi',
      hybrid: 'Hybrid',
      demoBannerTitle: 'Demo Workspace',
      demoBannerBody:
        'Data sampel dan Simulator Pembayaran Sandbox aktif agar Anda dapat menguji seluruh alur kerja.',
      dismiss: 'Tutup pemberitahuan',
      installApp: 'Pasang Aplikasi',
      offlineNotice: 'Mode luring: menampilkan tampilan tersimpan.',
      sandboxNotice: 'Simulator Pembayaran Sandbox aktif.',
    },
    gateway: {
      heroTitle: 'Kolaborasi aman ber-Escrow tempat keahlian dinilai sebelum nama.',
      heroSubtitle:
        'TIMU menghubungkan UMKM dengan talenta muda melalui pencarian tanpa bias berbasis keahlian, Escrow pihak ketiga, dan sertifikat penyelesaian terverifikasi.',
      ctaTalent: 'Mulai First Quest',
      ctaEmployer: 'Cari Talenta Tanpa Bias',
      previewTitle: 'Pencarian Tanpa Bias dan Escrow Transparan',
      previewSubtitle:
        'Tinjau keahlian terverifikasi, pendidikan, dan kecocokan lokasi sebelum memakai 1 Token untuk membuka identitas dan Chat Escrow.',
      howTitle: 'Dirancang untuk kepercayaan dua arah',
      pricingTitle: 'Harga transparan dan terukur',
      verifyPromptTitle: 'Verifikasi Sertifikat Penyelesaian TIMU',
      verifyPlaceholder: 'Masukkan kode, mis. TIMU-2026-A84K2P',
      verifyButton: 'Verifikasi Kode',
    },
    escrow: {
      grossBudget: 'Anggaran Proyek (100%)',
      platformFee: 'Biaya Admin Platform (10%)',
      netPayout: 'Penerimaan Bersih Talenta (90%)',
      complianceNote:
        'Dana ditahan oleh Penyedia Layanan Pembayaran pihak ketiga berlisensi (atau Simulator Pembayaran Sandbox di mode uji), tidak pernah di rekening pribadi.',
      pendingFunding: 'Menunggu Pendanaan',
      funded: 'Dana Dilindungi Escrow',
      deliverableSubmitted: 'Hasil Kerja Dikirim',
      released: 'Dana Dicairkan',
      disputed: 'Dalam Tinjauan',
      hireAndFund: 'Hire & Kunci Escrow',
      submitDeliverable: 'Kirim Hasil Kerja',
      approveAndRelease: 'Setujui & Cairkan Escrow',
    },
    discovery: {
      title: 'Cari Talenta Tanpa Bias',
      subtitle: 'Evaluasi keahlian terverifikasi, pendidikan, dan lokasi atau zona waktu sebelum membuka identitas.',
      identityHidden: 'Identitas disembunyikan sampai dibuka',
      skip: 'Lewati',
      unlockCta: 'Buka Chat & Hire (1 Token)',
      openChat: 'Buka Chat',
      privacyNotice: 'Nomor WhatsApp atau telepon hanya dibagikan jika talenta memilih membagikannya di dalam chat.',
      revealModalTitle: 'Buka Chat & Hire dengan 1 Token',
      revealModalBody:
        '1 Token membuka nama lengkap, foto profil, ruang Chat langsung, dan fitur Hire ber-Escrow. Pendanaan Proyek Escrow dilakukan terpisah dengan Biaya Admin Platform 10% saat pencairan.',
      confirmUnlock: 'Buka Chat & Hire (1 Token)',
      emptyTitle: 'Tidak ada kandidat yang cocok di tampilan ini',
      emptyBody: 'Atur ulang filter atau muat ulang kandidat yang dilewati untuk melanjutkan pencarian.',
    },
    firstQuest: {
      title: 'First Quest Onboarding',
      subtitle: 'Selesaikan 6 misi untuk meraih 100 EXP, naik ke Level 1, dan menerbitkan kartu talenta Anda.',
      previewCard: 'Pratinjau Kartu Saya',
      completeCta: 'Selesaikan Quest & Naik ke Level 1',
      rookieUnlocked: 'Level 1 Aktif',
      skillsCounter: 'Top 3 Skills',
    },
    opportunities: {
      title: 'Cari Proyek',
      subtitle: 'Lamar proyek ber-Escrow atau pekerjaan paruh waktu dan penuh waktu dari UMKM lokal maupun remote.',
      allTypes: 'Semua Proyek',
      escrowProject: 'Proyek Escrow',
      partTimeJob: 'Pekerjaan Part-Time',
      fullTimeJob: 'Pekerjaan Full-Time',
      applyWithPitch: 'Lamar Proyek',
      applied: 'Sudah Dilamar',
      shortlisted: 'Masuk Daftar Pendek',
      hired: 'Diterima',
      closed: 'Ditutup',
      publishCta: 'Buat Proyek Baru (1 Token)',
    },
    certificate: {
      pageTitle: 'Sertifikat Penyelesaian Terverifikasi',
      issuedBy: 'UMKM Penerbit',
      awardedTo: 'Diberikan Kepada',
      projectLabel: 'Proyek Escrow Selesai',
      validatedSkills: 'Lencana Keahlian Tervalidasi',
      verificationId: 'ID Verifikasi',
      issuedDate: 'Tanggal Terbit',
      copyLink: 'Salin Tautan Verifikasi',
      copied: 'Tautan Disalin',
      downloadPdf: 'Unduh / Cetak PDF',
      authenticBanner: 'Catatan penyelesaian Proyek Escrow TIMU terverifikasi asli.',
    },
  },
};

export function getDictionary(locale: LocaleCode): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}
