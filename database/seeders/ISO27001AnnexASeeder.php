<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Requirement;
use App\Models\Framework;

class ISO27001AnnexASeeder extends Seeder
{
    public function run(): void
    {
        // Adapte selon ton organisation — prends le premier framework ISO27001 trouvé
        $framework = Framework::where('code', 'like', '%ISO27001%')
                               ->orWhere('code', 'like', '%ISO%')
                               ->first();

        if (!$framework) {
            $this->command->error('Aucun framework ISO27001 trouvé !');
            return;
        }

        $orgId = $framework->organization_id;
        $this->command->info("Framework trouvé : {$framework->name} (org: {$orgId})");

        $controls = [
            // Section 5 — Organisationnels (37 mesures)
            ['code' => 'ISO-A.5.1',  'title' => 'Politiques de sécurité de l\'information',              'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.2',  'title' => 'Fonctions et responsabilités liées à la sécurité',      'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.3',  'title' => 'Séparation des tâches',                                  'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.4',  'title' => 'Responsabilités de la direction',                        'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.5',  'title' => 'Contacts avec les autorités',                            'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.6',  'title' => 'Contacts avec des groupes d\'intérêt spécifiques',      'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.7',  'title' => 'Renseignement sur les menaces',                          'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.8',  'title' => 'Sécurité de l\'information dans la gestion de projet',  'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.9',  'title' => 'Inventaire des informations et autres actifs',           'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.10', 'title' => 'Utilisation correcte des informations et actifs',        'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.11', 'title' => 'Restitution des actifs',                                 'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.12', 'title' => 'Classification des informations',                        'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.13', 'title' => 'Marquage des informations',                              'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.14', 'title' => 'Transfert des informations',                             'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.15', 'title' => 'Contrôle d\'accès',                                     'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.16', 'title' => 'Gestion des identités',                                  'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.17', 'title' => 'Informations d\'authentification',                       'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.18', 'title' => 'Droits d\'accès',                                       'type' => 'regulatory',  'frequency' => 'quarterly'],
            ['code' => 'ISO-A.5.19', 'title' => 'Sécurité de l\'information dans les relations fournisseurs', 'type' => 'contractual', 'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.20', 'title' => 'Sécurité de l\'information dans les accords fournisseurs',   'type' => 'contractual', 'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.21', 'title' => 'Gestion sécurité chaîne d\'approvisionnement TIC',      'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.22', 'title' => 'Surveillance et révision des services fournisseurs',    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.23', 'title' => 'Sécurité de l\'information dans les services cloud',    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.24', 'title' => 'Planification de la gestion des incidents',              'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.25', 'title' => 'Évaluation des événements de sécurité',                 'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.26', 'title' => 'Réponse aux incidents de sécurité',                     'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.27', 'title' => 'Tirer des enseignements des incidents',                  'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.28', 'title' => 'Collecte de preuves',                                    'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.5.29', 'title' => 'Sécurité de l\'information pendant une perturbation',   'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.30', 'title' => 'Préparation des TIC pour la continuité d\'activité',    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.31', 'title' => 'Exigences légales, statutaires et contractuelles',      'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.32', 'title' => 'Droits de propriété intellectuelle',                    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.33', 'title' => 'Protection des enregistrements',                        'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.34', 'title' => 'Protection de la vie privée et des DCP',               'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.35', 'title' => 'Révision indépendante de la sécurité',                 'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.36', 'title' => 'Conformité aux politiques et normes de sécurité',      'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.5.37', 'title' => 'Procédures d\'exploitation documentées',               'type' => 'regulatory',  'frequency' => 'yearly'],

            // Section 6 — Personnes (8 mesures)
            ['code' => 'ISO-A.6.1', 'title' => 'Sélection des candidats',                               'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.6.2', 'title' => 'Termes et conditions du contrat de travail',            'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.6.3', 'title' => 'Sensibilisation, enseignement et formation',            'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.6.4', 'title' => 'Processus disciplinaire',                               'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.6.5', 'title' => 'Responsabilités après la fin d\'un emploi',            'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.6.6', 'title' => 'Accords de confidentialité ou de non-divulgation',     'type' => 'contractual', 'frequency' => 'yearly'],
            ['code' => 'ISO-A.6.7', 'title' => 'Travail à distance',                                    'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.6.8', 'title' => 'Déclaration des événements de sécurité',               'type' => 'internal',    'frequency' => 'continuous'],

            // Section 7 — Physiques (14 mesures) — complète les manquants
            ['code' => 'ISO-A.7.1',  'title' => 'Périmètres de sécurité physique',                     'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.2',  'title' => 'Les entrées physiques',                                'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.7.3',  'title' => 'Sécurisation des bureaux, salles et installations',   'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.4',  'title' => 'Surveillance de la sécurité physique',                'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.7.5',  'title' => 'Protection contre les menaces physiques',             'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.6',  'title' => 'Travail dans les zones sécurisées',                   'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.7',  'title' => 'Bureau propre et écran vide',                         'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.7.8',  'title' => 'Emplacement et protection du matériel',               'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.9',  'title' => 'Sécurité des actifs hors des locaux',                'type' => 'internal',    'frequency' => 'continuous'],
            ['code' => 'ISO-A.7.10', 'title' => 'Supports de stockage',                                'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.11', 'title' => 'Services supports',                                   'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.12', 'title' => 'Sécurité du câblage',                                'type' => 'internal',    'frequency' => 'yearly'],
            ['code' => 'ISO-A.7.13', 'title' => 'Maintenance du matériel',                             'type' => 'internal',    'frequency' => 'quarterly'],
            ['code' => 'ISO-A.7.14', 'title' => 'Élimination ou recyclage sécurisé du matériel',      'type' => 'internal',    'frequency' => 'continuous'],

            // Section 8 — Technologiques (34 mesures) — complète les manquants
            ['code' => 'ISO-A.8.1',  'title' => 'Terminaux finaux des utilisateurs',                   'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.2',  'title' => 'Droits d\'accès privilégiés',                        'type' => 'regulatory',  'frequency' => 'quarterly'],
            ['code' => 'ISO-A.8.3',  'title' => 'Restriction d\'accès aux informations',              'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.4',  'title' => 'Accès aux codes source',                             'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.5',  'title' => 'Authentification sécurisée',                         'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.6',  'title' => 'Dimensionnement',                                     'type' => 'regulatory',  'frequency' => 'quarterly'],
            ['code' => 'ISO-A.8.7',  'title' => 'Protection contre les programmes malveillants',      'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.8',  'title' => 'Gestion des vulnérabilités techniques',              'type' => 'regulatory',  'frequency' => 'monthly'],
            ['code' => 'ISO-A.8.9',  'title' => 'Gestion des configurations',                         'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.10', 'title' => 'Suppression des informations',                       'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.11', 'title' => 'Masquage des données',                               'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.12', 'title' => 'Prévention de la fuite de données',                  'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.13', 'title' => 'Sauvegarde des informations',                        'type' => 'regulatory',  'frequency' => 'monthly'],
            ['code' => 'ISO-A.8.14', 'title' => 'Redondance des moyens de traitement',                'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.15', 'title' => 'Journalisation',                                     'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.16', 'title' => 'Activités de surveillance',                          'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.17', 'title' => 'Synchronisation des horloges',                       'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.18', 'title' => 'Utilisation de programmes utilitaires à privilèges', 'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.19', 'title' => 'Installation de logiciels sur systèmes opérationnels','type' => 'regulatory', 'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.20', 'title' => 'Sécurité des réseaux',                               'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.21', 'title' => 'Sécurité des services réseau',                       'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.22', 'title' => 'Cloisonnement des réseaux',                          'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.23', 'title' => 'Filtrage web',                                       'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.24', 'title' => 'Utilisation de la cryptographie',                    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.25', 'title' => 'Cycle de vie de développement sécurisé',            'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.26', 'title' => 'Exigences de sécurité des applications',            'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.27', 'title' => 'Principes d\'ingénierie des systèmes sécurisés',    'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.28', 'title' => 'Codage sécurisé',                                    'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.29', 'title' => 'Tests de sécurité dans le développement',           'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.30', 'title' => 'Développement externalisé',                          'type' => 'contractual', 'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.31', 'title' => 'Séparation des environnements dev/test/prod',       'type' => 'regulatory',  'frequency' => 'yearly'],
            ['code' => 'ISO-A.8.32', 'title' => 'Gestion des changements',                            'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.33', 'title' => 'Informations de test',                               'type' => 'regulatory',  'frequency' => 'continuous'],
            ['code' => 'ISO-A.8.34', 'title' => 'Protection des systèmes pendant les tests d\'audit','type' => 'regulatory',  'frequency' => 'yearly'],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($controls as $control) {
            $exists = Requirement::where('organization_id', $orgId)
                                 ->where('code', $control['code'])
                                 ->exists();
            if ($exists) {
                $skipped++;
                continue;
            }

            Requirement::create([
                'organization_id'  => $orgId,
                'framework_id'     => $framework->id,
                'code'             => $control['code'],
                'title'            => $control['title'],
                'description'      => $control['title'],
                'type'             => $control['type'],
                'status'           => 'draft',
                'priority'         => 'high',
                'frequency'        => $control['frequency'],
                'compliance_level' => 'Mandatory',
                'effective_date'   => now()->toDateString(),
                'is_deleted'       => 0,
                'auto_validate'    => false,
            ]);

            $created++;
        }

        $this->command->info("✅ Créés: {$created} | ⏭️ Skippés (déjà existants): {$skipped}");
    }
}