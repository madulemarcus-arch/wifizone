# WiFi Zone Manager

Application web installable (PWA) pour gérer **WiFi Zone** : ventes de tickets, dépenses, clôture du jour et rapport du mois. Un seul fichier `index.html`, sans serveur, sans dépendance, utilisable hors connexion. Elle est indépendante de CISPOLstore Manager (autres données, autre icône) et de `caisse-simple/` / `caisse-locale/`.

Adresse : `https://madulemarcus-arch.github.io/wifizone/` (dépôt `madulemarcus-arch/wifizone`, publié par `.github/workflows/pages.yml`). Sur Android : menu du navigateur → « Installer l'application ».

## Lancer en local
`python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000. Pas de tests automatisés : vérifier à la main.

## Écrans
| Onglet | Rôle |
|---|---|
| 🏠 Accueil | Ventes, dépenses et bénéfice (aujourd'hui, 7 jours, mois), par forfait et par mode de paiement |
| 🎫 Vendre | Choisir le forfait, la quantité et le mode (Cash, M-Pesa, Airtel Money…), enregistrer ; liste des ventes du jour (✕ pour corriger) |
| 💸 Dépenses | Abonnement Starlink, électricité, salaire… en FC ou en $ (le taux du jour est figé dans chaque dépense) |
| 🤝 Emprunts | Noter quand quelqu'un emprunte (argent, ticket / forfait, matériel…) : nom, détail, montant, date, note. **Les vendeurs peuvent noter un emprunt et le marquer « Rendu »** ; seul un gérant peut le supprimer. Rappel sur l'accueil tant qu'il reste des emprunts non rendus ; synchronisé entre les appareils |
| 🌙 Clôture | Cash attendu en caisse, cash compté, écart, note ; envoi WhatsApp, copie, impression |
| 📊 Rapport | Mois par mois : par forfait, par catégorie de dépense, jour par jour ; WhatsApp, CSV, impression |
| ⚙️ Réglages | Nom, taux 1 $ = … FC, forfaits et prix (ajout, modification, suppression), **import des ventes de la caisse**, **synchronisation**, **code PIN**, sauvegarde / restauration |

## Règles
- Les ventes sont en francs (FC). Le bénéfice s'affiche aussi en dollars au taux du jour.
- Le cash attendu = ventes en Cash − dépenses payées en Cash, par devise.
- Les données sont dans le navigateur de l'appareil (`localStorage`, clé `wifizone-v1`). **Faites une sauvegarde régulière** (Réglages) : l'accueil le rappelle après 3 jours.
- Forfaits par défaut (repris de `caisse-locale`) : Visiteur 6 h 500 FC, Jour 24 h 1 000 FC, Semaine 7 j 7 000 FC, Mois 30 j 30 000 FC.

## Toutes les ventes (avec heure et code)

Rapport → **📋 Toutes les ventes** (ou le lien « Toutes les ventes › » de l'écran Vendre, ou le bouton de l'accueil). Une ligne par vente : forfait, quantité, **code du ticket**, date, **heure**, mode de paiement, montant. Périodes : aujourd'hui, 7 jours, ce mois, tout. La **recherche** retrouve une vente par code, forfait, mode ou date (utile quand un client dit « mon code ne marche pas » : cherchez le code, choisissez « Tout »). Export **CSV avec codes** et impression. Le CSV du mois (Rapport) contient aussi l'heure et le code.

## Tickets : génération et stock

Onglet **🎟 Tickets** de la barre du bas (au centre, en bleu), ou le gros bouton **« Générer des tickets »** en haut de l'accueil. L'écran s'ouvre sur la génération, puis le stock par forfait et les derniers lots.

- **Générer un lot** : choisir le forfait et le nombre (1 à 300). Chaque ticket est un code de 6 caractères : la **lettre du forfait** (V, J, S, M…) puis 5 caractères sans 0/O/1/I, unique parmi tous les tickets et ventes. Un fichier **`.rsc`** est téléchargé : une ligne `/ip hotspot user add name=CODE password=CODE profile=… server=…` par ticket, **sans commentaire** (le routeur y écrit lui-même l'expiration). Importer le fichier dans le routeur : Winbox → Files (glisser le fichier) → New Terminal → `/import file-name=…`.
- **Imprimer** (🖨️) : planche **A4 de 40 tickets** (4 colonnes × 10 lignes, marges de 8 mm, lignes de coupe en pointillé), au design CISPOLstore : bandeau avec logo, nom de l'activité et prix, code en capitales encadré, forfait et durée, nom du Wi-Fi et **QR code**. Le QR contient `http://<adresse>/login?username=<code en minuscules>` : en le scannant, la page de connexion du routeur s'ouvre avec le code déjà saisi. **CSV** (Excel) : code, forfait, prix, statut.
- **Une couleur par forfait** : le bandeau, le cadre, le code et le prix des tickets prennent la couleur du forfait, la même que son badge dans l'application (Visiteur vert, Jour bleu, Semaine orange, Mois violet ; les forfaits ajoutés reprennent ces couleurs dans l'ordre). Les couleurs sont fixes (indépendantes du thème de l'écran). En noir et blanc elles deviennent des gris, mais la lettre du forfait au début du code (V, J, S, M) les distingue toujours, et le QR reste noir sur blanc.
- **Réglages du ticket** : *Nom du Wi-Fi* (imprimé sur chaque ticket) et *Adresse de la page de connexion* (par défaut `wifi.cispolstore`, modifiable ; **vide = tickets sans QR**). Le bouton **🖨️ Page d'essai** imprime une ligne de 4 tickets d'essai (code `ESSAI1`) : scannez-en un avec un téléphone connecté au Wi-Fi avant d'imprimer un lot entier.
- **Condition côté routeur** : la page `login.html` du hotspot doit préremplir le champ avec `value="$(username)"` (c'est le cas de celle générée par CISPOLstore Gestion) et mettre le code en minuscules ; sinon le QR n'a aucun effet. Cette page n'est pas dans ce dépôt.
- **Stock** par forfait, alerte quand il reste moins de N tickets (réglable : Réglages, 10 par défaut), affichée sur l'accueil.
- **Vente** : si le forfait a un stock, la vente prend automatiquement un code au hasard dans le stock, l'affiche en grand et propose **WhatsApp / Copier**. Supprimer la vente remet le code en stock. Un forfait sans lot se vend comme avant, sans code.
- **Import des ventes de la caisse** : un ticket importé dont le code est en stock passe en « vendu ».
- **Réglages → ✎ forfait** : *lettre du code* (unique, non modifiable une fois des tickets créés) et *profil MikroTik* (nom exact du profil sur le routeur : Visiteur-6H, Jour-24H, Semaine-7J, Mois-30J par défaut). Réglages : *nom du serveur hotspot* (`hotspot-cispol`).
- **Case « Importé dans le routeur »** : un lot qui vient d'être généré est « à importer » : ses codes **ne sont pas vendus** et ne comptent pas dans le stock tant que vous n'avez pas coché « Importé dans le routeur » (après l'import du fichier `.rsc` dans Winbox). Une bannière orange le rappelle sur l'accueil, la vente et l'écran Tickets. On ne peut plus décocher un lot dont des tickets sont déjà vendus. Les lots créés avant cette fonction comptent comme importés.
- **Supprimer un lot** : le bouton **🗑** de chaque lot (écran Tickets, « Derniers lots ») retire le lot et ses codes de l'application et des autres appareils synchronisés. Il est grisé dès qu'un ticket du lot est vendu (annulez d'abord la vente pour remettre le code en stock). Si le lot avait été importé dans le routeur, un fichier **`supprimer-lot-….rsc`** est téléchargé : une ligne `/ip hotspot user remove [find where name=CODE]` par ticket, à importer dans le routeur (comme un lot) pour y supprimer aussi ces codes.
- **Plusieurs téléphones** : stock et lots se synchronisent. Si deux téléphones hors connexion vendent le même code, une alerte « code vendu deux fois » apparaît (accueil et onglet Tickets) ; un toucher donne un autre code au second client.

## Tickets papier et tickets de l'application (deux stocks séparés)

Un même code ne peut jamais être à la fois imprimé sur papier **et** donné par l'application.

- **Destination du lot** : à la génération, choisir **📱 Vente dans l'application** ou **🖨️ Tickets papier**. Le lot garde sa destination (badge sur chaque lot). Le fichier `.rsc` est le même ; seule l'utilisation change.
- **Deux stocks** : l'application ne distribue **que** les codes des lots « application » ; les codes des lots « papier » ne sortent jamais à l'écran de vente. L'écran Tickets affiche les deux compteurs (`🎟 … · 🖨️ papier : N`).
- **Impression** : le bouton 🖨️ n'existe que sur les lots « papier » (refusé sur un lot « application »).
- **Vendre un ticket papier** : écran Vendre → puce **🖨️ Ticket papier**. Avec le **code du ticket** (facultatif, pour une vente d'un seul ticket), ce ticket précis passe en « vendu » (refusé s'il est inconnu, déjà vendu ou de l'application). Sans code, les plus anciens tickets papier en stock sont comptés vendus. Aucun code n'est affiché au client ; la vente est marquée `🖨️ papier`.
- **Annuler une vente papier** remet ses tickets en stock papier. Le CSV « Toutes les ventes » a une colonne **Support** (Papier / Application).
- Alerte d'accueil quand le stock papier passe sous le seuil.

## Importer les ventes de la caisse (routeur MikroTik)

WiFi Zone Manager ne parle pas directement au routeur (une application publiée sur Internet ne peut pas joindre le réseau local du routeur). Le lien se fait par le fichier d'export de la caisse : dans la **caisse locale** (`caisse-locale/`) ou la **caisse simple** (`caisse-simple/`), bouton **Exporter en CSV**, puis dans WiFi Zone Manager : Réglages → **Importer les ventes de la caisse** → choisir le mode de paiement des ventes importées → choisir le fichier.

- Chaque ticket du fichier devient une vente d'un ticket (forfait, prix et date du fichier) ; le code du ticket s'affiche dans la liste des ventes.
- **Pas de doublon** : un ticket déjà importé (même code) est ignoré, on peut donc réimporter le même fichier ou un export plus large sans risque.
- Un forfait inconnu (nom absent de la liste) est créé automatiquement avec le prix du fichier.
- Les ventes importées se synchronisent entre téléphones comme les autres.
- Colonnes reconnues par leur titre : `Date`, `Forfait`, `Prix…` (obligatoires), `Code`, `Heure`, `Vendeur`.

## Synchronisation entre téléphones

Réglages → **Synchronisation entre téléphones** → Configurer (ou le bouton ☁️ de l'en-tête). Plusieurs téléphones partagent les mêmes ventes, dépenses, clôtures, forfaits, nom et taux ; les modifications faites hors connexion sur plusieurs téléphones sont **fusionnées** enregistrement par enregistrement (rien n'est écrasé), y compris les suppressions. Le code PIN reste propre à chaque téléphone.

- **Même serveur que CISPOLstore Manager** : si la synchronisation de CISPOLstore Manager est déjà configurée, saisissez la même URL Supabase et la même clé publique, avec le **nom d'espace `wifizone`** (différent de celui de CISPOLstore) : aucun nouveau script SQL à exécuter. Sinon, suivre les 4 étapes affichées dans la fenêtre de configuration (script `sync/supabase.sql`, bouton « Copier le script SQL »).
- **Chiffrement** : tout est chiffré sur le téléphone (AES-GCM, clé dérivée de la phrase secrète, 8 caractères minimum) avant l'envoi ; Supabase ne stocke qu'un bloc illisible. **Notez la phrase secrète** : elle ne peut pas être récupérée.
- Sur chaque autre téléphone, saisir **exactement les mêmes 4 valeurs** (URL, clé, nom d'espace, phrase secrète). Un nom d'espace déjà utilisé avec une autre phrase est refusé.
- Synchronisation automatique 4 secondes après chaque modification, au retour dans l'application, au retour de la connexion et toutes les 30 secondes ; bouton « Synchroniser maintenant ». Le bouton ☁️ indique l'état (☁️ à jour, 🔄 en cours, 📴 hors connexion, ⚠️ erreur).
- Déconnecter garde toutes les données sur le téléphone.

## Thèmes (clair / sombre)

Réglages → **Apparence** : **🌓 Auto** (suit le téléphone), **☀️ Clair**, **🌙 Sombre** ou **⚫ Noir** (fond noir pur, économise la batterie sur écran OLED). Le choix est **propre à chaque appareil** (il n'est pas synchronisé) et reste après la fermeture de l'application.

## Logo

Le logo mélange la marque CispolStore et le signe du WiFi : le **« C »** de CispolStore (bleu marine / blanc) s'ouvre vers le haut à droite, le **cube hexagonal** orange en est le cœur, et **trois ondes dégradées jaune → orange** en jaillissent comme un signal WiFi. Fichiers à la racine : `logo.svg` (marque sans fond, pour l'en-tête et les écrans de connexion), `icon-192.png` / `icon-512.png` (icône de l'application, fond bleu marine), `icon-maskable-512.png` (version « maskable » d'Android, marque réduite dans la zone sûre). Dossier `brand/` (non publié) : sources vectorielles `logo-icone.svg` (fond sombre), `logo-clair.svg` (fond blanc), `logo-sans-fond-clair.svg` et versions PNG 1024 px, pour l'impression, les réseaux sociaux ou une enseigne. Le fichier de publication (`.github/workflows/pages.yml`) copie `*.png` et `logo.svg` : tout nouveau fichier d'image publié doit y figurer, et dans `FILES` de `sw.js`.

## Mise à jour de l'application

L'application garde une copie pour fonctionner hors connexion : une nouvelle version est téléchargée en arrière-plan, puis une bannière **« Nouvelle version disponible — Actualiser »** apparaît. Si une nouveauté n'apparaît pas : **Réglages → Application → 🔄 Mettre à jour l'application**. Le bouton efface la copie en mémoire (service worker et caches `wifizone-*`) et recharge la dernière version ; **les données ne sont pas touchées**. Le numéro de version (`VERSION` dans `index.html`) doit rester identique à `CACHE` dans `sw.js` et être augmenté à chaque publication.

## Profils : gérants (jusqu'à 4), puis des vendeurs

**Connexion par code PIN seulement** : à l'ouverture (et après verrouillage, bouton 🔒 de l'en-tête), l'application affiche uniquement le pavé du code PIN. On ne choisit pas son nom : **le code ouvre directement le bon profil** (chaque code PIN, à 4 chiffres, doit donc être différent de ceux des autres profils ; l'application refuse un code déjà pris). 5 erreurs bloquent 30 secondes. Les codes sont stockés sous forme d'empreintes salées.

**Les deux premiers profils sont des gérants** (tous les droits), créés au démarrage. Ensuite, Réglages → Profils propose **+ Ajouter un vendeur** et **+ Ajouter un gérant** (jusqu'à **4 gérants** au total, utile quand un appareil de plus doit tout gérer). Le vendeur qui s'enregistre lui-même reste toujours un vendeur.
- **Première ouverture** : écran **« Bienvenue »** obligatoire (aucune annulation possible) : création du **premier gérant**, puis, aussitôt, du **deuxième gérant** (nom + code PIN, saisi deux fois). Rien n'est utilisable avant. Un appareil qui **rejoint les autres** choisit « Cet appareil rejoint les autres » : il récupère les profils par la synchronisation (pas de gérant créé par erreur).
- **Nouveau vendeur qui s'enregistre lui-même** : sur le pavé du code, **« Nouveau vendeur ? S'enregistrer »**. Un **gérant doit d'abord taper son propre code PIN** pour autoriser (un code de vendeur ne suffit pas ; 5 erreurs = 30 s d'attente). Le vendeur saisit alors **son nom et son code PIN** (deux fois ; le code doit être différent de ceux des autres profils), il est connecté tout de suite, et **les fois suivantes il ne tape que son code**. Annuler à n'importe quelle étape revient au pavé sans rien créer.
- **Vendeurs ajoutés par un gérant** : Réglages → **Profils** → **+ Ajouter un vendeur** (nom + code PIN), pour inscrire quelqu'un à sa place. Un gérant peut modifier le nom ou le code de n'importe quel profil, ou supprimer un vendeur (ou un gérant tant qu'il en reste un).
- **Désactiver** les profils redonne l'accès libre ; l'application ne les redemande plus (réglage synchronisé entre appareils).

| | Gérant | Vendeur |
|---|---|---|
| Vendre un ticket, voir le code | oui | oui |
| Ses propres ventes du jour | oui | oui (seulement les siennes) |
| Stock de tickets | oui | consultation |
| Générer / supprimer / marquer importé un lot | oui | non |
| Annuler une vente confirmée, dépenses, prix, réglages | oui | non |
| Accueil complet (bénéfice), Clôture, Rapport, Toutes les ventes | oui | non |

Les profils se **synchronisent** : un appareil qui les reçoit se verrouille aussitôt sur le pavé du code. Chaque vente enregistre le **nom de son auteur** (listes, recherche, CSV, clôture « Par profil »). Limite : les droits sont appliqués par l'application (ils évitent les erreurs et les abus courants), pas contre quelqu'un qui connaîtrait la phrase secrète de synchronisation. **Code oublié** : un gérant change le code (Réglages → Profils → ✎). Si les deux gérants ont oublié leur code, il faut effacer les données de l'application sur l'appareil (réglages du navigateur), puis restaurer une sauvegarde ou se resynchroniser.

## Code PIN

Réglages → Sécurité → **Créer un code PIN** (4 chiffres, saisi deux fois). L'application demande le code à l'ouverture et se reverrouille quand on la quitte (dès la sortie, après 2 min ou 10 min, au choix) ; bouton **🔒 Verrouiller** pour le faire à la main. Après 5 erreurs, attente de 30 secondes. Le code est stocké sous forme d'empreinte (SHA-256 avec sel), jamais en clair, et **n'est pas inclus dans les sauvegardes** : restaurer une sauvegarde garde le code de l'appareil. Changer ou supprimer le code demande le code actuel. **Code oublié** : seule issue, effacer les données de l'application sur l'appareil puis restaurer la dernière sauvegarde. Le code protège l'accès à l'écran, pas le contenu du stockage du navigateur.

## Code
Palette identique aux outils WiFi (`caisse-locale`) : marine #0a1f44, bleu #1b5fc1, forfaits vert / bleu / orange / violet.
Section `views.*` (écrans), `A` (actions), `db` (données), `modal`. Commentaires en anglais, textes en français. Incrémenter `CACHE` dans `sw.js` à chaque modification de l'application.

## Design (étape 1) : accueil et graphiques

- **Police Inter** embarquée (`fonts/inter-latin.woff2`, licence dans `fonts/`), chiffres alignés.
- **Accueil gérant** : grande carte « Ventes » avec salutation selon l'heure, comparaison avec la période précédente (hier, 7 jours précédents, mois dernier), courbe des ventes, sélecteur de période, chiffre qui monte jusqu'à sa valeur (sauf si l'appareil demande moins d'animations).
- **Graphiques** (sans bibliothèque) : répartition des ventes par forfait (anneau) et ventes par jour (barres) ; un toucher affiche la valeur exacte.
- Les profils vendeurs gardent l'accueil simplifié.

## Design (étape 2) : la vente et les petits effets

- **Vendre** : bandeau « Ventes du jour » (montant et tickets), ventes du jour avec pastille de la lettre du forfait (couleur du forfait) et mode de paiement avec icône (💵 Cash, 📱 mobile money, 🏦 Banque).
- **Vente enregistrée** : une coche ✓ animée et une vibration légère. Quand la journée dépasse **toutes les journées précédentes**, confettis 🎉 et message « Record » (une seule fois par jour).
- **Vibration légère** sur la barre du bas, le choix du forfait, la quantité et les filtres, si le téléphone le permet.
- **Effet au toucher** sur les puces, les cartes cliquables, la quantité et la barre du bas.
- Confettis, coche et effets sont désactivés quand l'appareil demande de réduire les animations.

## Design (étape 3) : ordinateur

- **Menu à gauche** (écrans de 1024 px et plus) à la place de la barre du bas, avec le logo, l'onglet actif en couleur et Tickets mis en avant. Sur téléphone, rien ne change.
- **Accueil sur deux colonnes** (à partir de 1280 px) : la carte des ventes en grand, puis répartition par forfait / ventes par jour, et par forfait / par mode de paiement côte à côte.
- **Raccourcis clavier** (ignorés pendant la saisie, avec une fenêtre ouverte ou sur l'écran verrouillé, et limités aux droits du profil) : `H` accueil, `V` vendre, `T` tickets, `D` dépenses, `C` clôture, `R` rapport, `S` réglages ; sur Vendre : `1`…`9` forfait, `+` / `−` quantité, `Entrée` enregistrer la vente ; `?` aide (aussi dans le menu de gauche).

## Design (étape 4) : Rapport, Clôture, Réglages

- **Rapport du mois** : grande carte avec les ventes du mois, la comparaison au mois précédent, les dépenses et le bénéfice net (≈ en dollars), boutons ‹ Précédent / Suivant › dans la carte ; puis anneau de répartition par forfait et barres des ventes jour par jour (un toucher donne la valeur). Les listes détaillées, WhatsApp, CSV et l'impression restent en dessous.
- **Clôture du jour** : carte avec la date, l'état (« Pas encore clôturée », « ✓ Clôturée » ou « ⚠ Écart … »), les ventes, les dépenses, le bénéfice et le cash attendu. Une clôture **sans aucun écart** déclenche des confettis 🎉.
- **Réglages** : en-tête avec le logo, le nom, la version, le profil connecté et trois pastilles d'état : PIN, sauvegarde (récente en vert, ancienne ou absente en jaune), synchronisation. Un toucher sur « Sans PIN » ou sur la sauvegarde lance l'action directement (selon les droits du profil).
- À l'impression, les cartes s'impriment en noir sur blanc.

## Installer l'application

Réglages → Application → **📲 Installer l'application sur ce téléphone** : ouvre directement la fenêtre d'installation du navigateur quand elle est disponible, sinon explique la marche à suivre (Chrome → ⋮ → « Installer l'application »). Le fichier d'installation (`manifest.webmanifest`) est aligné sur celui de CISPOLstore (nouvel identifiant `wifizone-manager-app`, icônes standard plus une icône « adaptative » pour Android).

## Publier sur le Google Play Store

Le dossier `play/` contient tout ce qu'il faut (guide pas à pas, textes de la fiche, captures avec données fictives, modèle `assetlinks.json`) : voir `play/README.md`. Côté application : manifeste « Android » (icône adaptative, 4 raccourcis `?go=sell|tix|day|rep`), page `privacy.html` liée dans Réglages, tests automatiques dans `tests/` (`cd tests && npm install && npx playwright install chromium && node run.js`, aussi sur GitHub à chaque push).

## Tableau de bord animé

L'écran **Accueil** est animé comme dans CISPOLstore Manager : étoiles reliées en réseau, lueurs néon, et une scène qui change au hasard (train de satellites, pluie de météores, comète, ondes Wi-Fi, orbites, vague de lumière), sur toute la page et dans la carte des ventes. Réglages → Apparence → **✨ Animation de l'accueil** : *Aucune*, *Calme*, *Équilibrée* (par défaut) ou *Intense* (rythme, quantité et fréquence des scènes). Le choix est propre à l'appareil. L'animation reste légère (une seule boucle à ~30 images/s, canvas sans clic) et s'arrête seule sur les autres écrans, quand l'application passe en arrière-plan, avec « réduire les animations » ou l'économiseur de données, et à l'impression.

## Rapport par vendeur

Pour savoir **ce que chaque vendeur a vendu** : écran **Rapport → 👥 Rapport par vendeur** (réservé aux gérants). Période au choix : *Aujourd'hui*, *7 jours*, *Ce mois*, *Tout*. L'écran affiche le total (montant, tickets, ventes, nombre de vendeurs actifs), puis **un classement** (🥇🥈🥉) avec, pour chaque vendeur : le montant, les tickets, sa **part du total** (barre et %), l'heure de sa dernière vente, le détail **par forfait** (quantité et montant, aux couleurs des forfaits), **par mode de paiement** et le nombre de tickets papier. Un vendeur sans vente sur la période apparaît quand même (« Aucune vente »), et les ventes faites sans profil sont regroupées sous **« Sans vendeur »**. Boutons : **WhatsApp** (classement en texte), **CSV** (une ligne par vendeur, avec une colonne de tickets par forfait) et **Imprimer**.

Chaque vente est attribuée au **profil connecté** au moment de la vente : activez les profils (Réglages → Profils) pour que chaque vendeur ait son code PIN. Un vendeur ne voit pas ce rapport (il garde « Mes ventes aujourd'hui » sur son accueil).
