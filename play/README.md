# Publier WiFi Zone Manager sur le Google Play Store

Même méthode que CISPOLstore Manager (voir `play/README.md` du dépôt `kaleidoscope-sonore`, qui détaille chaque étape). L'application reste la même : le Play Store reçoit une « enveloppe Android » (*Trusted Web Activity*) qui ouvre l'application web, **hors connexion comprise**. Quand l'application est modifiée, vos utilisateurs ont la nouvelle version tout de suite, sans republier.

**Décisions prises** : application **gratuite** pour votre équipe · adresse `https://madulemarcus-arch.github.io/wifizone/` conservée · compte Play Console unique (25 $, déjà payé pour CISPOLstore Manager : **pas de second paiement**).

## Ce qui est déjà prêt dans ce dossier

| Élément | Où |
|---|---|
| Manifeste prêt pour Android (icône « adaptative », raccourcis longs appuis : Vendre un ticket, Tickets, Clôture du jour, Rapport) | `manifest.webmanifest` |
| Politique de confidentialité (obligatoire) | `https://madulemarcus-arch.github.io/wifizone/privacy.html` (et lien dans Réglages) |
| Textes de la fiche, réponses aux questionnaires | `fiche-play-store.md` |
| 7 captures d'écran (fausses données), image de présentation 1024×500, icône 512 | `captures/` |
| Modèle du fichier de vérification Android | `assetlinks.json.modele` |
| Tests automatiques (manifeste, version, raccourcis…) | `tests/` (CI : `.github/workflows/tests.yml`) |

Nom sur Android : **WiFi Zone Manager** · identifiant du paquet : `com.cispolstore.wifizone` (à ne plus changer).

## Étapes (identiques à CISPOLstore Manager)

1. **Compte développeur** : déjà créé pour CISPOLstore Manager, rien à refaire.
2. **Paquet Android** avec <https://www.pwabuilder.com>, adresse `https://madulemarcus-arch.github.io/wifizone/`, réglages :
   - *Package ID* : `com.cispolstore.wifizone`
   - *App name* : `WiFi Zone Manager` · *Launcher name* : `WiFi Zone`
   - *App version* : `1.0.0` · *Version code* : `1`
   - *Host* : `madulemarcus-arch.github.io` · *Start URL* : `/wifizone/index.html?source=pwa`
   - *Display mode* : Standalone · *Notification delegation* : désactivé · *Signing key* : **Create new** (une clé **différente** de celle de CISPOLstore Manager)
   - Gardez le `.keystore` et ses mots de passe en lieu sûr, hors du téléphone.
3. **Console Play** : créer l'application « WiFi Zone Manager » (Français, Application, Gratuite), téléverser le `.aab` dans un test fermé, remplir la fiche avec `fiche-play-store.md` et les images de `captures/`.
4. **Test fermé** : 12 testeurs pendant 14 jours si Google l'exige encore pour votre compte (vérifiez dans la console), puis demande d'accès à la production.

## Supprimer la barre d'adresse (empreinte SHA-256)

Les deux applications partagent la même adresse de base (`madulemarcus-arch.github.io`), donc **un seul fichier** `https://madulemarcus-arch.github.io/.well-known/assetlinks.json` contient **les deux** applications (deux blocs, un par paquet : `com.cispolstore.manager` et `com.cispolstore.wifizone`).

1. Console : **Configuration › Intégrité de l'application › Signature d'application** de WiFi Zone Manager : copiez l'empreinte **SHA-256**.
2. Envoyez-la-moi (elle est publique par nature) : j'ajoute le second bloc au fichier du dépôt `madulemarcus-arch.github.io`.

Sans ce fichier, l'application fonctionne mais affiche une barre d'adresse en haut.

## Régénérer les captures

Les images viennent de `generer-captures.js` (données **fictives**) :
`cd tests && npm install && npx playwright install chromium`, puis `node play/generer-captures.js` depuis la racine du dépôt.
