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
- **Imprimer** (🖨️) : planche A4 de tickets découpables (4 colonnes) ; **CSV** (Excel) : code, forfait, prix, statut.
- **Stock** par forfait, alerte quand il reste moins de N tickets (réglable : Réglages, 10 par défaut), affichée sur l'accueil.
- **Vente** : si le forfait a un stock, la vente prend automatiquement un code au hasard dans le stock, l'affiche en grand et propose **WhatsApp / Copier**. Supprimer la vente remet le code en stock. Un forfait sans lot se vend comme avant, sans code.
- **Import des ventes de la caisse** : un ticket importé dont le code est en stock passe en « vendu ».
- **Réglages → ✎ forfait** : *lettre du code* (unique, non modifiable une fois des tickets créés) et *profil MikroTik* (nom exact du profil sur le routeur : Visiteur-6H, Jour-24H, Semaine-7J, Mois-30J par défaut). Réglages : *nom du serveur hotspot* (`hotspot-cispol`).
- **Case « Importé dans le routeur »** : un lot qui vient d'être généré est « à importer » : ses codes **ne sont pas vendus** et ne comptent pas dans le stock tant que vous n'avez pas coché « Importé dans le routeur » (après l'import du fichier `.rsc` dans Winbox). Une bannière orange le rappelle sur l'accueil, la vente et l'écran Tickets. On ne peut plus décocher un lot dont des tickets sont déjà vendus. Les lots créés avant cette fonction comptent comme importés.
- **Plusieurs téléphones** : stock et lots se synchronisent. Si deux téléphones hors connexion vendent le même code, une alerte « code vendu deux fois » apparaît (accueil et onglet Tickets) ; un toucher donne un autre code au second client.

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
- Synchronisation automatique 4 secondes après chaque modification, au retour dans l'application, au retour de la connexion et toutes les 90 secondes ; bouton « Synchroniser maintenant ». Le bouton ☁️ indique l'état (☁️ à jour, 🔄 en cours, 📴 hors connexion, ⚠️ erreur).
- Déconnecter garde toutes les données sur le téléphone.

## Mise à jour de l'application

L'application garde une copie pour fonctionner hors connexion : une nouvelle version est téléchargée en arrière-plan, puis une bannière **« Nouvelle version disponible — Actualiser »** apparaît. Si une nouveauté n'apparaît pas : **Réglages → Application → 🔄 Mettre à jour l'application**. Le bouton efface la copie en mémoire (service worker et caches `wifizone-*`) et recharge la dernière version ; **les données ne sont pas touchées**. Le numéro de version (`VERSION` dans `index.html`) doit rester identique à `CACHE` dans `sw.js` et être augmenté à chaque publication.

## Code PIN

Réglages → Sécurité → **Créer un code PIN** (4 chiffres, saisi deux fois). L'application demande le code à l'ouverture et se reverrouille quand on la quitte (dès la sortie, après 2 min ou 10 min, au choix) ; bouton **🔒 Verrouiller** pour le faire à la main. Après 5 erreurs, attente de 30 secondes. Le code est stocké sous forme d'empreinte (SHA-256 avec sel), jamais en clair, et **n'est pas inclus dans les sauvegardes** : restaurer une sauvegarde garde le code de l'appareil. Changer ou supprimer le code demande le code actuel. **Code oublié** : seule issue, effacer les données de l'application sur l'appareil puis restaurer la dernière sauvegarde. Le code protège l'accès à l'écran, pas le contenu du stockage du navigateur.

## Code
Palette identique aux outils WiFi (`caisse-locale`) : marine #0a1f44, bleu #1b5fc1, forfaits vert / bleu / orange / violet.
Section `views.*` (écrans), `A` (actions), `db` (données), `modal`. Commentaires en anglais, textes en français. Incrémenter `CACHE` dans `sw.js` à chaque modification de l'application.
