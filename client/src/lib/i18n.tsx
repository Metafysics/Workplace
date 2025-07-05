import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'nl' | 'en' | 'fr' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  nl: {
    // Navigation & Header
    'nav.workmoments': 'WorkMoments',
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Werknemers',
    'nav.media': 'Media Bibliotheek',
    'nav.referrals': 'Verwijzingen',
    'nav.templates': 'Sjablonen',
    'nav.analytics': 'Analyses',
    
    // Dashboard
    'dashboard.title': 'HR Dashboard',
    'dashboard.quickActions': 'Snelle Acties',
    'dashboard.recentActivity': 'Recente Activiteit',
    'dashboard.viewAll': 'Alles Bekijken',
    'dashboard.stats.totalEmployees': 'Totaal Werknemers',
    'dashboard.stats.activeTimelines': 'Actieve Tijdlijnen',
    'dashboard.stats.complimentsSent': 'Complimenten Verstuurd',
    'dashboard.stats.mediaItems': 'Media Items',
    
    // Quick Actions
    'actions.addEmployee': 'Werknemer Toevoegen',
    'actions.uploadMedia': 'Media Uploaden',
    'actions.createTemplate': 'Sjabloon Maken',
    'actions.sendCompliment': 'Compliment Versturen',
    
    // Employee Management
    'employees.title': 'Werknemers Beheer',
    'employees.search': 'Zoeken...',
    'employees.department': 'Afdeling',
    'employees.allDepartments': 'Alle Afdelingen',
    'employees.name': 'Naam',
    'employees.email': 'Email',
    'employees.hireDate': 'Datum in Dienst',
    'employees.nfcToken': 'NFC Token',
    'employees.actions': 'Acties',
    'employees.noEmployees': 'Geen werknemers gevonden. Voeg werknemers toe om te beginnen!',
    
    // Media Library
    'media.title': 'Media Bibliotheek',
    'media.comingSoon': 'Media Bibliotheek Binnenkort Beschikbaar',
    'media.description': 'Media beheer functies worden binnenkort beschikbaar.',
    
    // Templates
    'templates.title': 'Sjablonen',
    'templates.comingSoon': 'Sjablonen Binnenkort Beschikbaar',
    'templates.description': 'Sjabloon beheer functies worden binnenkort beschikbaar.',
    
    // Analytics
    'analytics.title': 'Analyses',
    'analytics.comingSoon': 'Analyses Binnenkort Beschikbaar',
    'analytics.description': 'Geavanceerde analyse en rapportage functies worden binnenkort beschikbaar.',
    
    // Buttons & Actions
    'button.cancel': 'Annuleren',
    'button.save': 'Opslaan',
    'button.create': 'Aanmaken',
    'button.upload': 'Uploaden',
    'button.edit': 'Bewerken',
    'button.delete': 'Verwijderen',
    'button.view': 'Bekijken',
    'button.download': 'Downloaden',
    
    // Coming Soon
    'comingSoon.templates': 'Sjablonen Binnenkort Beschikbaar',
    'comingSoon.templatesDesc': 'Sjabloon beheer functies worden binnenkort beschikbaar.',
    'comingSoon.analytics': 'Analyses Binnenkort Beschikbaar',
    'comingSoon.analyticsDesc': 'Geavanceerde analyse en rapportage functies worden binnenkort beschikbaar.',
    
    // Language Selection
    'language.select': 'Taal Selecteren',
    'language.dutch': 'Nederlands',
    'language.english': 'Engels',
    'language.french': 'Frans',
    'language.spanish': 'Spaans',
  },
  
  en: {
    // Navigation & Header
    'nav.workmoments': 'WorkMoments',
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Employees',
    'nav.media': 'Media Library',
    'nav.referrals': 'Referrals',
    'nav.templates': 'Templates',
    'nav.analytics': 'Analytics',
    
    // Dashboard
    'dashboard.title': 'HR Dashboard',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.viewAll': 'View All',
    'dashboard.stats.totalEmployees': 'Total Employees',
    'dashboard.stats.activeTimelines': 'Active Timelines',
    'dashboard.stats.complimentsSent': 'Compliments Sent',
    'dashboard.stats.mediaItems': 'Media Items',
    
    // Quick Actions
    'actions.addEmployee': 'Add Employee',
    'actions.uploadMedia': 'Upload Media',
    'actions.createTemplate': 'Create Template',
    'actions.sendCompliment': 'Send Compliment',
    
    // Employee Management
    'employees.title': 'Employee Management',
    'employees.search': 'Search...',
    'employees.department': 'Department',
    'employees.allDepartments': 'All Departments',
    'employees.name': 'Name',
    'employees.email': 'Email',
    'employees.hireDate': 'Hire Date',
    'employees.nfcToken': 'NFC Token',
    'employees.actions': 'Actions',
    'employees.noEmployees': 'No employees found. Add some employees to get started!',
    
    // Media Library
    'media.title': 'Media Library',
    'media.comingSoon': 'Media Library Coming Soon',
    'media.description': 'Media management features will be available soon.',
    
    // Templates
    'templates.title': 'Templates',
    'templates.comingSoon': 'Templates Coming Soon',
    'templates.description': 'Template management features will be available soon.',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.comingSoon': 'Analytics Coming Soon',
    'analytics.description': 'Advanced analytics and reporting features will be available soon.',
    
    // Buttons & Actions
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.create': 'Create',
    'button.upload': 'Upload',
    'button.edit': 'Edit',
    'button.delete': 'Delete',
    'button.view': 'View',
    'button.download': 'Download',
    
    // Coming Soon
    'comingSoon.templates': 'Templates Coming Soon',
    'comingSoon.templatesDesc': 'Template management features will be available soon.',
    'comingSoon.analytics': 'Analytics Coming Soon',
    'comingSoon.analyticsDesc': 'Advanced analytics and reporting features will be available soon.',
    
    // Language Selection
    'language.select': 'Select Language',
    'language.dutch': 'Dutch',
    'language.english': 'English',
    'language.french': 'French',
    'language.spanish': 'Spanish',
  },
  
  fr: {
    // Navigation & Header
    'nav.workmoments': 'WorkMoments',
    'nav.dashboard': 'Tableau de Bord',
    'nav.employees': 'Employés',
    'nav.media': 'Bibliothèque Média',
    'nav.referrals': 'Recommandations',
    'nav.templates': 'Modèles',
    'nav.analytics': 'Analyses',
    
    // Dashboard
    'dashboard.title': 'Tableau de Bord RH',
    'dashboard.quickActions': 'Actions Rapides',
    'dashboard.recentActivity': 'Activité Récente',
    'dashboard.viewAll': 'Voir Tout',
    'dashboard.stats.totalEmployees': 'Total Employés',
    'dashboard.stats.activeTimelines': 'Chronologies Actives',
    'dashboard.stats.complimentsSent': 'Compliments Envoyés',
    'dashboard.stats.mediaItems': 'Éléments Média',
    
    // Quick Actions
    'actions.addEmployee': 'Ajouter Employé',
    'actions.uploadMedia': 'Télécharger Média',
    'actions.createTemplate': 'Créer Modèle',
    'actions.sendCompliment': 'Envoyer Compliment',
    
    // Employee Management
    'employees.title': 'Gestion des Employés',
    'employees.search': 'Rechercher...',
    'employees.department': 'Département',
    'employees.allDepartments': 'Tous les Départements',
    'employees.name': 'Nom',
    'employees.email': 'Email',
    'employees.hireDate': 'Date d\'Embauche',
    'employees.nfcToken': 'Token NFC',
    'employees.actions': 'Actions',
    'employees.noEmployees': 'Aucun employé trouvé. Ajoutez des employés pour commencer!',
    
    // Media Library
    'media.title': 'Bibliothèque Média',
    'media.comingSoon': 'Bibliothèque Média Bientôt Disponible',
    'media.description': 'Les fonctionnalités de gestion des médias seront bientôt disponibles.',
    
    // Templates
    'templates.title': 'Modèles',
    'templates.comingSoon': 'Modèles Bientôt Disponibles',
    'templates.description': 'Les fonctionnalités de gestion des modèles seront bientôt disponibles.',
    
    // Analytics
    'analytics.title': 'Analyses',
    'analytics.comingSoon': 'Analyses Bientôt Disponibles',
    'analytics.description': 'Les fonctionnalités d\'analyse et de rapport avancées seront bientôt disponibles.',
    
    // Buttons & Actions
    'button.cancel': 'Annuler',
    'button.save': 'Sauvegarder',
    'button.create': 'Créer',
    'button.upload': 'Télécharger',
    'button.edit': 'Modifier',
    'button.delete': 'Supprimer',
    'button.view': 'Voir',
    'button.download': 'Télécharger',
    
    // Coming Soon
    'comingSoon.templates': 'Modèles Bientôt Disponibles',
    'comingSoon.templatesDesc': 'Les fonctionnalités de gestion de modèles seront disponibles bientôt.',
    'comingSoon.analytics': 'Analyses Bientôt Disponibles',
    'comingSoon.analyticsDesc': 'Les fonctionnalités avancées d\'analyse et de rapport seront disponibles bientôt.',
    
    // Language Selection
    'language.select': 'Sélectionner la Langue',
    'language.dutch': 'Néerlandais',
    'language.english': 'Anglais',
    'language.french': 'Français',
    'language.spanish': 'Espagnol',
  },
  
  es: {
    // Navigation & Header
    'nav.workmoments': 'WorkMoments',
    'nav.dashboard': 'Panel de Control',
    'nav.employees': 'Empleados',
    'nav.media': 'Biblioteca de Medios',
    'nav.referrals': 'Referencias',
    'nav.templates': 'Plantillas',
    'nav.analytics': 'Análisis',
    
    // Dashboard
    'dashboard.title': 'Panel de Control RRHH',
    'dashboard.quickActions': 'Acciones Rápidas',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.viewAll': 'Ver Todo',
    'dashboard.stats.totalEmployees': 'Total Empleados',
    'dashboard.stats.activeTimelines': 'Líneas de Tiempo Activas',
    'dashboard.stats.complimentsSent': 'Cumplidos Enviados',
    'dashboard.stats.mediaItems': 'Elementos de Medios',
    
    // Quick Actions
    'actions.addEmployee': 'Agregar Empleado',
    'actions.uploadMedia': 'Subir Medios',
    'actions.createTemplate': 'Crear Plantilla',
    'actions.sendCompliment': 'Enviar Cumplido',
    
    // Employee Management
    'employees.title': 'Gestión de Empleados',
    'employees.search': 'Buscar...',
    'employees.department': 'Departamento',
    'employees.allDepartments': 'Todos los Departamentos',
    'employees.name': 'Nombre',
    'employees.email': 'Email',
    'employees.hireDate': 'Fecha de Contratación',
    'employees.nfcToken': 'Token NFC',
    'employees.actions': 'Acciones',
    'employees.noEmployees': '¡No se encontraron empleados. Agrega empleados para comenzar!',
    
    // Media Library
    'media.title': 'Biblioteca de Medios',
    'media.comingSoon': 'Biblioteca de Medios Próximamente',
    'media.description': 'Las funciones de gestión de medios estarán disponibles pronto.',
    
    // Templates
    'templates.title': 'Plantillas',
    'templates.comingSoon': 'Plantillas Próximamente',
    'templates.description': 'Las funciones de gestión de plantillas estarán disponibles pronto.',
    
    // Analytics
    'analytics.title': 'Análisis',
    'analytics.comingSoon': 'Análisis Próximamente',
    'analytics.description': 'Las funciones avanzadas de análisis e informes estarán disponibles pronto.',
    
    // Buttons & Actions
    'button.cancel': 'Cancelar',
    'button.save': 'Guardar',
    'button.create': 'Crear',
    'button.upload': 'Subir',
    'button.edit': 'Editar',
    'button.delete': 'Eliminar',
    'button.view': 'Ver',
    'button.download': 'Descargar',
    
    // Coming Soon
    'comingSoon.templates': 'Plantillas Próximamente',
    'comingSoon.templatesDesc': 'Las funciones de gestión de plantillas estarán disponibles pronto.',
    'comingSoon.analytics': 'Análisis Próximamente',
    'comingSoon.analyticsDesc': 'Las funciones avanzadas de análisis e informes estarán disponibles pronto.',
    
    // Language Selection
    'language.select': 'Seleccionar Idioma',
    'language.dutch': 'Holandés',
    'language.english': 'Inglés',
    'language.french': 'Francés',
    'language.spanish': 'Español',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('nl'); // Default to Dutch

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('workmoments-language') as Language;
    if (savedLanguage && ['nl', 'en', 'fr', 'es'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('workmoments-language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}