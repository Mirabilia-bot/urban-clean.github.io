<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Chantiers - Collectivités Territoriales</title>
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/prop-types/prop-types.min.js"></script>
    <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
</head>
<body>

    <div id="root"></div>

    <script type="text/babel">
        // Liaison des modules globaux pour remplacer les déclarations d'importation ES6
        const { useState, useCallback, useMemo } = React;
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } = Recharts;

        // ─── PALETTE & STYLES ───────────────────────────────────────────────
        const C = {
          navy: "#0D1B2A", navyLight: "#1A2E47",
          teal: "#00B4A6", tealDark: "#008F84", tealGlow: "rgba(0,180,166,0.15)",
          gold: "#F0A500", goldDark: "#C88700",
          red: "#E63946", green: "#2DC653", orange: "#FF7A2F",
          gray1: "#F4F7FB", gray2: "#E4EBF5", gray3: "#A8B8CC", gray4: "#617D9B",
          white: "#FFFFFF", text: "#0D1B2A", textLight: "#617D9B",
        };
        const PIE_COLORS = [C.teal, C.gold, C.green, C.orange, C.red, "#8B5CF6"];

        // ─── DONNÉES INITIALES ───────────────────────────────────────────────
        const INIT_CHANTIERS = [
          {
            id: 1, nom: "Réhabilitation RD104", commune: "Saint-Lô",
            maitriseOuvrage: "Département Manche", maitriseOeuvre: "Cabinet SETEC",
            budget: 2400000, depense: 1680000, avancement: 70,
            debut: "2025-03-01", fin: "2026-06-30",
            statut: "En cours", categorie: "Voirie",
            lots: [
              { nom: "Terrassement", titulaire: "COLAS", montant: 480000, avancement: 100 },
              { nom: "Chaussée", titulaire: "EUROVIA", montant: 960000, avancement: 75 },
              { nom: "Signalisation", titulaire: "SIGNAUX GIROD", montant: 240000, avancement: 30 },
              { nom: "Assainissement", titulaire: "SAUR TP", montant: 720000, avancement: 60 },
            ],
            intervenants: ["Jean Dupont (MOA)", "Marie Leroux (MOE)", "Paul Renard (CT)"],
            incidents: ["Retard livraison enrobés (j+5)", "Intempéries semaine 12"],
          },
          {
            id: 2, nom: "Construction École Primaire", commune: "Coutances",
            maitriseOuvrage: "Mairie de Coutances", maitriseOeuvre: "Archi & Partners",
            budget: 5800000, depense: 1740000, avancement: 30,
            debut: "2025-09-01", fin: "2027-07-31",
            statut: "En cours", categorie: "Bâtiment",
            lots: [
              { nom: "Gros œuvre", titulaire: "BOUYGUES", montant: 2320000, avancement: 45 },
              { nom: "Menuiseries", titulaire: "LAPEYRE PRO", montant: 580000, avancement: 10 },
              { nom: "CVC", titulaire: "DALKIA", montant: 870000, avancement: 5 },
              { nom: "Électricité", titulaire: "EIFFAGE E.", montant: 1160000, avancement: 0 },
              { nom: "VRD", titulaire: "COLAS", montant: 870000, avancement: 60 },
            ],
            intervenants: ["Sophie Martin (MOA)", "Eric Blanc (MOE)", "Luc Noël (BET)"],
            incidents: [],
          },
          {
            id: 3, nom: "Réseau AEP Zone Sud", commune: "Avranches",
            maitriseOuvrage: "Syndicat des Eaux", maitriseOeuvre: "SAFEGE",
            budget: 1200000, depense: 1200000, avancement: 100,
            debut: "2024-04-01", fin: "2025-12-15",
            statut: "Terminé", categorie: "Réseaux",
            lots: [
              { nom: "Pose canalisation", titulaire: "IDEX", montant: 840000, avancement: 100 },
              { nom: "Raccordements", titulaire: "SOGEA", montant: 360000, avancement: 100 },
            ],
            intervenants: ["Alain Petit (MOA)", "Claire Dumont (MOE)"],
            incidents: ["Découverte réseau gaz non répertorié"],
          },
          {
            id: 4, nom: "Aménagement Centre-Bourg", commune: "Granville",
            maitriseOuvrage: "Mairie de Granville", maitriseOeuvre: "Atelier Paysage",
            budget: 890000, depense: 0, avancement: 0,
            debut: "2026-04-01", fin: "2027-03-31",
            statut: "Planifié", categorie: "Espaces Publics",
            lots: [
              { nom: "Démolition", titulaire: "À désigner", montant: 89000, avancement: 0 },
              { nom: "Pavage & mobilier", titulaire: "À désigner", montant: 534000, avancement: 0 },
              { nom: "Végétalisation", titulaire: "À désigner", montant: 267000, avancement: 0 },
            ],
            intervenants: ["Marc Leroy (MOA)"],
            incidents: [],
          },
        ];

        // ─── UTILITAIRES ─────────────────────────────────────────────────────
        const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
        const today = () => new Date().toLocaleDateString("fr-FR");
        const statutColor = (s) => ({
          "En cours": C.teal, "Terminé": C.green, "Planifié": C.gold, "Suspendu": C.red, "En retard": C.orange,
        }[s] || C.gray3);
        const catIcon = (c) => ({ "Voirie": "🛣️", "Bâtiment": "🏗️", "Réseaux": "🔧", "Espaces Publics": "🌳" }[c] || "📋");

        // ─── GÉNÉRATEUR DE DOCUMENTS LOCAL (100% GRATUIT & AUTONOME) ─────────
        function generateLocalDocument(type, c, dateSeance) {
          const dateFmt = new Date(dateSeance).toLocaleDateString("fr-FR");
          
          // Génération des listes textuelles des lots et intervenants
          const listeLots = c.lots.length > 0 
            ? c.lots.map(l => `  - Lot : ${l.nom} | Titulaire : ${l.titulaire} | Avancement : ${l.avancement}% | Montant : ${fmt(l.montant)}`).join("\n")
            : "  - Aucun lot configuré pour ce chantier.";
            
          const listeIntervenants = c.intervenants.length > 0 
            ? c.intervenants.map(i => `  - ${i}`).join("\n")
            : "  - Non spécifiés (cf. CCAP)";

          const listeIncidents = c.incidents.length > 0 
            ? c.incidents.map(i => `  [⚠️ INCIDENT] : ${i}`).join("\n")
            : "  [✅ RAS] : Aucun incident ou réserve à signaler à ce jour.";

          const templates = {
            CR: `========================================================================
                      COMPTE-RENDU DE CHANTIER
========================================================================
Réf : CR-CHANTIER-${c.id}-${new Date(dateSeance).getFullYear()}
Date de la séance : ${dateFmt}
Chantier : ${c.nom} (${c.commune})

1. ENCADREMENT ET ACTEURS
------------------------------------------------------------------------
• Maîtrise d'Ouvrage (MOA) : ${c.maitriseOuvrage}
• Maîtrise d'Œuvre (MOE)  : ${c.maitriseOeuvre}

2. ÉTAT D'AVANCEMENT GLOBAL
------------------------------------------------------------------------
L'avancement physique cumulé des travaux est estimé à ${c.avancement}%.
Statut administratif du chantier : ${c.statut}

3. SITUATION DÉTAILLÉE PAR LOTS
------------------------------------------------------------------------
${listeLots}

4. ÉVÉNEMENTS ET INCIDENTS SIGNALÉS
------------------------------------------------------------------------
${listeIncidents}

5. DIRECTIVES ET PROCHAINE RÉUNION
------------------------------------------------------------------------
• Les titulaires de lots doivent corriger les écarts mentionnés ci-dessus.
• La prochaine réunion de chantier aura lieu sous 15 jours sur site.
------------------------------------------------------------------------
Fait à ${c.commune}, le ${dateFmt}.`,

            PV: `========================================================================
             PROCÈS-VERBAL DE RÉUNION DE MAÎTRISE D'ŒUVRE
========================================================================
Date de validation : ${dateFmt}
Projet : ${c.nom} — Localisation : ${c.commune}

LISTE DES PARTICIPANTS ET ÉMARGINATIONS
------------------------------------------------------------------------
${listeIntervenants}

ORDRE DU JOUR ET DÉCISIONS ADOPTÉES
------------------------------------------------------------------------
1. REVUE DE L'AVANCEMENT PHYSIQUE
   L'état d'avancement des ouvrages s'établit à ${c.avancement}%. 
   Les recalages de planning nécessaires ont été notifiés aux entreprises.

2. SITUATION FINANCIÈRE DE L'OPÉRATION
   • Budget initial approuvé : ${fmt(c.budget)}
   • Dépenses liquidées à ce jour : ${fmt(c.depense)}
   • Taux d'exécution budgétaire : ${Math.round((c.depense / c.budget) * 100)}%

3. POINTS TECHNIQUES & ARBITRAGES
   ${c.incidents.length > 0 ? "Des mesures correctives immédiates sont exigées sur les points suivants :\n" + listeIncidents : "Aucun point de blocage majeur recensé. Les travaux se déroulent conformément aux plans d'exécution."}

------------------------------------------------------------------------
Le présent procès-verbal vaut constatation des décisions prises pour la continuité du service public.`,

            RAPPORT: `========================================================================
                     RAPPORT MENSUEL D'AVANCEMENT
========================================================================
À l'attention de : Monsieur l'Élu Référent / Direction des Services Techniques
Période de référence : ${new Date(dateSeance).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}

CADRE GÉNÉRAL DE L'OPÉRATION
------------------------------------------------------------------------
• Libellé : ${c.nom}
• Commune d'implantation : ${c.commune}
• Calendrier contractuel : Du ${fmtDate(c.debut)} au ${fmtDate(c.fin)}

SITUATION BUDGÉTAIRE
------------------------------------------------------------------------
• Enveloppe Globale (TTC) : ${fmt(c.budget)}
• Crédits consommés       : ${fmt(c.depense)}
• Solde disponible        : ${fmt(c.budget - c.depense)}

ANALYSE TECHNIQUE & CHRONOGRAMME
------------------------------------------------------------------------
L'opération est exécutée à hauteur de ${c.avancement}% de ses objectifs initiaux.
Statut actuel de l'opération : ${c.statut}

Détail de la décomposition des prestations :
${listeLots}

SYNTHÈSE DES RISQUES
------------------------------------------------------------------------
${listeIncidents}
------------------------------------------------------------------------
Rapport établi de manière automatisée par les Services de Gestion Territoriale le ${dateFmt}.`,

            PVRECEP: `========================================================================
      PROCÈS-VERBAL D'OPÉRATIONS PRÉALABLES À LA RÉCEPTION (OPR)
========================================================================
Date de la visite de réception : ${dateFmt}
Opération : ${c.nom}
Commune de : ${c.commune}

CONSTATS ET EXAMEN DES OUVRAGES
------------------------------------------------------------------------
Les représentants de la maîtrise d'ouvrage (${c.maitriseOuvrage}) et de la maîtrise d'œuvre (${c.maitriseOeuvre}) ont procédé à l'examen contradictoire des prestations réalisées.

• Avancement général constaté : ${c.avancement}%

LISTE DES RÉSERVES RELEVÉES
------------------------------------------------------------------------
${c.incidents.length > 0 ? listeIncidents : "  [NEANT] Les ouvrages examinés ne présentent pas de malfaçons apparentes. La réception peut être prononcée."}

DÉCISION ET EFFETS CONTRACTUELS
------------------------------------------------------------------------
• Un délai rigoureux de 30 jours est accordé aux entreprises concernées pour procéder à la levée complète des réserves notifiées ci-dessus.
• Passé ce délai, il sera fait application des mesures coercitives prévues au CCAG-Travaux.

Signataires présents lors de la visite : MOA, MOE, Entrepreneurs.`,

            ORDRE: `========================================================================
                        ORDRE DE SERVICE (O.S. N°01)
========================================================================
Date d'émission : ${dateFmt}
Affaire : ${c.nom} — Commune : ${c.commune}
Autorité émettrice : ${c.maitriseOuvrage}

À l'attention de l'Entreprise titulaire du lot principal :
${c.lots[0] ? `Société ${c.lots[0].titulaire} (Attributaire du lot: ${c.lots[0].nom})` : "Entreprise titulaire désignée au marché"}

OBJET : ORDRE DE DÉMARRER LES PRESTATIONS
------------------------------------------------------------------------
En exécution des stipulations du Cahier des Clauses Administratives Particulières (CCAP) du marché public référencé, il vous est ordonné par la présente de commencer les travaux d'exécution à la date de notification du présent document.

RAPPELS CONTRACTUELS :
------------------------------------------------------------------------
• Enveloppe financière affectée : ${fmt(c.budget)}
• Date butoir de livraison globale : ${fmtDate(c.fin)}
• Les délais d'exécution fixés au calendrier contractuel s'appliquent de plein droit sous peine de pénalités de retard.

Pour la Maîtrise d'Ouvrage,
Notification validée le ${dateFmt}.`,

            MISE_DEMEURE: `========================================================================
              LETTRE RECOMMANDÉE DE MISE EN DEMEURE
========================================================================
Date de notification : ${dateFmt}
Opération : ${c.nom} (${c.commune})
Maître d'Ouvrage : ${c.maitriseOuvrage}

À l'attention de l'Entreprise défaillante / Groupement d'entreprises :
${c.lots.filter(l => l.avancement < 100 && l.avancement > 0)[0] ? `Société ${c.lots.filter(l => l.avancement < 100 && l.avancement > 0)[0].titulaire}` : "Titulaire de lot"}

OBJET : MISE EN DEMEURE POUR RETARD SUR LE PLANNING CONTRACTUEL
------------------------------------------------------------------------
Monsieur,

Après constatation contradictoire sur le site, il apparaît un retard manifeste et injustifié dans l'avancement de vos prestations, mettant en péril l'avancement des autres corps d'état et la date de livraison finale (prévue le ${fmtDate(c.fin)}).

Manquements relevés :
${listeIncidents}

Injonction :
Par la présente, vous êtes mis en demeure de prendre toutes les dispositions nécessaires pour rétablir la cadence d'exécution sous un délai impératif de huit (8) jours calendaires à compter de la date du présent document.

À défaut de régularisation dans ce délai, le Maître d'Ouvrage appliquera unilatéralement les pénalités financières journalières prévues au CCAP, ou procédera à l'exécution des travaux à vos frais et risques exclusifs.

Sous toutes réserves de droit,
Fait à ${c.commune}, le ${dateFmt}.`
          };

          return templates[type] || "Type de document inconnu.";
        }

        // ─── COMPOSANTS UI ───────────────────────────────────────────────────
        const Badge = ({ label, color }) => (
          <span style={{
            background: color + "22", color, border: `1px solid ${color}44`,
            padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            letterSpacing: 0.5, display: "inline-block",
          }}>{label}</span>
        );

        const KpiCard = ({ icon, label, value, sub, color }) => (
          <div style={{
            background: C.white, borderRadius: 14, padding: "20px 22px",
            boxShadow: "0 2px 12px rgba(13,27,42,0.07)",
            borderLeft: `4px solid ${color}`, flex: 1, minWidth: 160,
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Georgia', serif" }}>{value}</div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
          </div>
        );

        const ProgressBar = ({ value, color = C.teal, height = 8, showLabel = true }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, background: C.gray2, borderRadius: 99, height, overflow: "hidden" }}>
              <div style={{
                width: `${value}%`, height: "100%",
                background: value >= 100 ? C.green : value > 60 ? C.teal : value > 30 ? C.gold : C.orange,
                borderRadius: 99, transition: "width 0.6s ease",
              }} />
            </div>
            {showLabel && <span style={{ fontSize: 11, fontWeight: 700, color: C.textLight, minWidth: 32 }}>{value}%</span>}
          </div>
        );

        // ─── SECTION : TABLEAU DE BORD ───────────────────────────────────────
        function Dashboard({ chantiers }) {
          const total = chantiers.length;
          const encours = chantiers.filter(c => c.statut === "En cours").length;
          const termines = chantiers.filter(c => c.statut === "Terminé").length;
          const budgetTotal = chantiers.reduce((s, c) => s + c.budget, 0);
          const depenseTotal = chantiers.reduce((s, c) => s + c.depense, 0);
          const avancementMoyen = Math.round(chantiers.filter(c=>c.statut!=="Planifié").reduce((s, c) => s + c.avancement, 0) / Math.max(chantiers.filter(c=>c.statut!=="Planifié").length, 1));
          const barData = chantiers.map(c => ({ name: c.nom.substring(0, 14) + "…", budget: c.budget / 1000, depense: c.depense / 1000 }));
          const pieData = ["Voirie","Bâtiment","Réseaux","Espaces Publics"].map(cat => ({
            name: cat, value: chantiers.filter(c => c.categorie === cat).reduce((s, c) => s + c.budget, 0) / 1000
          })).filter(d => d.value > 0);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <KpiCard icon="🏗️" label="Chantiers actifs" value={encours} sub={`${total} au total`} color={C.teal} />
                <KpiCard icon="✅" label="Terminés" value={termines} color={C.green} />
                <KpiCard icon="💰" label="Budget engagé" value={fmt(budgetTotal)} sub={`${Math.round(depenseTotal/budgetTotal*100)}% consommé`} color={C.gold} />
                <KpiCard icon="📊" label="Avancement moyen" value={`${avancementMoyen}%`} sub="chantiers actifs" color={C.orange} />
              </div>

              <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(13,27,42,0.07)", marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 1 }}>Décomposition par lots</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.gray1 }}>
                        {["Lot", "Titulaire", "Montant", "Avancement"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: C.textLight, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chantier.lots.map((lot, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.gray2}` }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{lot.nom}</td>
                          <td style={{ padding: "10px 12px", color: C.textLight }}>{lot.titulaire}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>{fmt(lot.montant)}</td>
                          <td style={{ padding: "10px 12px", minWidth: 160 }}><ProgressBar value={lot.avancement} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220, background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(13,27,42,0.07)" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 1 }}>👥 Intervenants</h3>
                  {chantier.intervenants.map((p, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: i < chantier.intervenants.length - 1 ? `1px solid ${C.gray2}` : "none", fontSize: 13, color: C.text }}>• {p}</div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 220, background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(13,27,42,0.07)" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 1 }}>⚠️ Incidents / Réserves</h3>
                  {chantier.incidents.length === 0
                    ? <div style={{ color: C.green, fontSize: 13 }}>✅ Aucun incident signalé</div>
                    : chantier.incidents.map((inc, i) => (
                      <div key={i} style={{ padding: "6px 0", borderBottom: i < chantier.incidents.length - 1 ? `1px solid ${C.gray2}` : "none", fontSize: 13, color: C.red }}>⚠️ {inc}</div>
                    ))}
                </div>
              </div>
            </div>
          );
        }

        // ─── SECTION : GÉNÉRATEUR DE DOCUMENTS ──────────────────────────────
        function Documents({ chantiers }) {
          const [docType, setDocType] = useState("CR");
          const [chantierId, setChantierId] = useState(chantiers[0]?.id || "");
          const [loading, setLoading] = useState(false);
          const [output, setOutput] = useState("");
          const [dateSeance, setDateSeance] = useState(new Date().toISOString().split("T")[0]);

          const DOC_TYPES = [
            { id: "CR", label: "Compte-Rendu de Chantier", icon: "📝" },
            { id: "PV", label: "Procès-Verbal de Réunion", icon: "📋" },
            { id: "RAPPORT", label: "Rapport d'Avancement", icon: "📊" },
            { id: "PVRECEP", label: "PV de Réception (OPR)", icon: "✅" },
            { id: "ORDRE", label: "Ordre de Service", icon: "📬" },
            { id: "MISE_DEMEURE", label: "Mise en Demeure", icon: "⚖️" },
          ];
          const chantier = chantiers.find(c => c.id == chantierId);

          const generateDoc = () => {
            if (!chantier) return;
            setLoading(true);
            setOutput("");
            
            // Simulation d'un effet de calcul très rapide (300ms) pour garder l'aspect UI
            setTimeout(() => {
              try {
                const result = generateLocalDocument(docType, chantier, dateSeance);
                setOutput(result);
              } catch (e) {
                setOutput("Erreur lors de la génération interne du document.");
              }
              setLoading(false);
            }, 350);
          };

          const copyToClipboard = () => { navigator.clipboard?.writeText(output); };
          return (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 280px", minWidth: 260 }}>
                <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(13,27,42,0.07)" }}>
                  <h3>⚙️ Paramètres</h3>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Type de document</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, marginBottom: 16 }}>
                    {DOC_TYPES.map(d => (
                      <button key={d.id} onClick={() => setDocType(d.id)} style={{
                        padding: "8px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                        background: docType === d.id ? C.navy : C.gray1, color: docType === d.id ? C.white : C.text,
                        border: `1px solid ${docType === d.id ? C.navy : C.gray2}`, fontSize: 12, fontWeight: 600,
                      }}>{d.icon} {d.label}</button>
                    ))}
                  </div>

                  <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Chantier</label>
                  <select value={chantierId} onChange={e => setChantierId(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 16, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.gray2}`, fontSize: 13, background: C.gray1 }}>
                    {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>

                  <label style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Date du document</label>
                  <input type="date" value={dateSeance} onChange={e => setDateSeance(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 20, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.gray2}` }} />

                  <button onClick={generateDoc} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading ? C.gray3 : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: C.white, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
                    {loading ? "⏳ Génération en cours…" : "✨ Générer le document"}
                  </button>
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(45, 198, 83, 0.1)", borderRadius: 8, fontSize: 11, color: C.green, border: `1px solid ${C.green}33` }}>
                    🟢 Générateur local autonome : Vos données ne quittent pas votre navigateur. Utilisation gratuite et illimitée.
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(13,27,42,0.07)", minHeight: 400 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>
                      {DOC_TYPES.find(d => d.id === docType)?.icon} {DOC_TYPES.find(d => d.id === docType)?.label}
                    </h3>
                    {output && <button onClick={copyToClipboard} style={{ background: C.navy, color: C.white, border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>📋 Copier</button>}
                  </div>
                  {!output && !loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: C.gray3 }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Configurez et génerez votre document</div>
                    </div>
                  )}
                  {loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300 }}>⏳ Rédaction en cours...</div>}
                  {output && <div style={{ fontSize: 13, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace", background: C.gray1, padding: 16, borderRadius: 10, border: `1px solid ${C.gray2}` }}>{output}</div>}
                </div>
              </div>
            </div>
          );
        }

        // ─── SECTION : FORMULAIRE CHANTIER ──────────────────────────────────
        function ChantierForm({ initial, onSave, onCancel }) {
          const [form, setForm] = useState(initial || {
            nom: "", commune: "", maitriseOuvrage: "", maitriseOeuvre: "",
            budget: "", depense: 0, avancement: 0,
            debut: "", fin: "", statut: "Planifié", categorie: "Voirie",
            lots: [], intervenants: [], incidents: [],
          });
          const [newLot, setNewLot] = useState({ nom: "", titulaire: "", montant: 0, avancement: 0 });
          const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

          return (
            <div style={{ background: C.white, borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(13,27,42,0.07)", maxWidth: 700 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontFamily: "'Georgia', serif", color: C.text }}>
                {initial ? "✏️ Modifier le chantier" : "➕ Nouveau chantier"}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["Nom du chantier", "nom", "text"], ["Commune", "commune", "text"],
                  ["Maîtrise d'ouvrage", "maitriseOuvrage", "text"], ["Maîtrise d'œuvre", "maitriseOeuvre", "text"],
                  ["Budget (€)", "budget", "number"], ["Dépensé (€)", "depense", "number"],
                  ["Date de début", "debut", "date"], ["Date de fin", "fin", "date"],
                ].map(([label, key, type]) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.gray2}`, fontSize: 13 }} />
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Statut</label>
                  <select value={form.statut} onChange={e => set("statut", e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.gray2}` }}>
                    {["Planifié", "En cours", "Terminé", "Suspendu", "En retard"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Catégorie</label>
                  <select value={form.categorie} onChange={e => set("categorie", e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.gray2}` }}>
                    {["Voirie", "Bâtiment", "Réseaux", "Espaces Publics", "Autre"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textLight }}>Avancement global : {form.avancement}%</label>
                  <input type="range" min={0} max={100} value={form.avancement} onChange={e => set("avancement", Number(e.target.value))} style={{ width: "100%", marginTop: 6 }} />
                </div>
              </div>

              {/* SECTION RESTAURÉE : GESTION INTERACTIVE DES LOTS */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>Lots</h4>
                {form.lots.map((lot, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.gray2}`, fontSize: 13 }}>
                    <span style={{ flex: 1 }}>{lot.nom}</span><span style={{ color: C.textLight }}>{lot.titulaire}</span>
                    <span style={{ color: C.navy, fontWeight: 600 }}>{fmt(lot.montant)}</span>
                    <Badge label={`${lot.avancement}%`} color={C.teal} />
                    <button onClick={() => set("lots", form.lots.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[["Nom lot", "nom", "text"], ["Titulaire", "titulaire", "text"], ["Montant €", "montant", "number"], ["Avancement %", "avancement", "number"]].map(([ph, k, t]) => (
                    <input key={k} placeholder={ph} type={t} value={newLot[k]} onChange={e => setNewLot(l => ({ ...l, [k]: t === "number" ? Number(e.target.value) : e.target.value }))} style={{ flex: 1, minWidth: 100, padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.gray2}`, fontSize: 12 }} />
                  ))}
                  <button type="button" onClick={() => { if (newLot.nom) { set("lots", [...form.lots, newLot]); setNewLot({ nom: "", titulaire: "", montant: 0, avancement: 0 }); } }} style={{ padding: "6px 14px", background: C.teal, color: C.white, border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700 }}>+ Lot</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => onSave(form)} style={{ flex: 1, padding: "12px", background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: C.white, border: "none", borderRadius: 10, fontWeight: 800 }}>💾 Enregistrer</button>
                <button onClick={onCancel} style={{ padding: "12px 20px", background: C.gray1, color: C.textLight, border: `1px solid ${C.gray2}`, borderRadius: 10 }}>Annuler</button>
              </div>
            </div>
          );
        }

        // ─── APP PRINCIPALE ──────────────────────────────────────────────────
        const NAV = [
          { id: "dashboard", label: "Tableau de bord", icon: "📊" },
          { id: "chantiers", label: "Chantiers", icon: "🏗️" },
          { id: "documents", label: "Documents & PV", icon: "📋" },
        ];

        function App() {
          const [tab, setTab] = useState("dashboard");
          const [chantiers, setChantiers] = useState(INIT_CHANTIERS);
          const [selected, setSelected] = useState(null);
          const [editing, setEditing] = useState(null);
          const [showForm, setShowForm] = useState(false);

          const saveChantier = (form) => {
            if (editing) {
              setChantiers(cs => cs.map(c => c.id === editing.id ? { ...editing, ...form } : c));
            } else {
              setChantiers(cs => [...cs, { ...form, id: Date.now(), budget: Number(form.budget), depense: Number(form.depense), lots: form.lots || [], intervenants: form.intervenants || [], incidents: form.incidents || [] }]);
            }
            setShowForm(false); setEditing(null);
          };

          return (
            <div style={{ display: "flex", minHeight: "100vh", background: C.gray1, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
              <aside style={{ width: 220, background: C.navy, display: "flex", flexDirection: "column", padding: "0 0 20px", flexShrink: 0 }}>
                <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase" }}>Gestion des</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.white, lineHeight: 1.1, fontFamily: "'Georgia', serif" }}>Chantiers</div>
                  <div style={{ fontSize: 10, color: C.gray3, marginTop: 4 }}>Collectivités Territoriales</div>
                </div>

                <nav style={{ padding: "16px 12px", flex: 1 }}>
                  {NAV.map(n => (
                    <button key={n.id} onClick={() => { setTab(n.id); setSelected(null); setShowForm(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4, textAlign: "left", background: tab === n.id ? C.tealGlow : "transparent", color: tab === n.id ? C.teal : C.gray3, fontWeight: tab === n.id ? 700 : 500, fontSize: 13 }}>
                      <span>{n.icon}</span>{n.label}
                      {tab === n.id && <span style={{ marginLeft: "auto", width: 3, height: 20, background: C.teal, borderRadius: 3 }} />}
                    </button>
                  ))}
                </nav>

                {/* BLOC RESTAURÉ : STATS RAPIDES SIDEBAR */}
                <div style={{ padding: "12px 16px", margin: "0 12px", background: "rgba(0,180,166,0.1)", borderRadius: 10, border: `1px solid ${C.teal}22` }}>
                  <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Résumé rapide</div>
                  {[
                    ["En cours", chantiers.filter(c => c.statut === "En cours").length, C.teal],
                    ["Terminés", chantiers.filter(c => c.statut === "Terminé").length, C.green],
                    ["Planifiés", chantiers.filter(c => c.statut === "Planifié").length, C.gold],
                  ].map(([l, v, col]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.gray3, padding: "3px 0" }}>
                      <span>{l}</span><span style={{ color: col, fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </aside>

          <main style={{ flex: 1, padding: "28px 28px", overflowY: "auto", maxWidth: "calc(100vw - 220px)" }}>
                <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, fontFamily: "'Georgia', serif" }}>
                      {NAV.find(n => n.id === tab)?.icon} {NAV.find(n => n.id === tab)?.label}
                    </h1>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textLight }}>Dernière mise à jour : {today()}</p>
                  </div>
                </div>

                {tab === "dashboard" && <Dashboard chantiers={chantiers} />}
                {tab === "chantiers" && !selected && !showForm && <Chantiers chantiers={chantiers} onSelect={setSelected} onAdd={() => { setEditing(null); setShowForm(true); }} />}
                {tab === "chantiers" && selected && !showForm && <ChantierDetail chantier={selected} onBack={() => setSelected(null)} onEdit={() => { setEditing(selected); setShowForm(true); setSelected(null); }} />}
                {showForm && <ChantierForm initial={editing} onSave={saveChantier} onCancel={() => { setShowForm(false); setEditing(null); }} />}
                {tab === "documents" && <Documents chantiers={chantiers} />}
              </main>
            </div>
          );
        }

        // Montage de l'application sur le nœud root HTML
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
