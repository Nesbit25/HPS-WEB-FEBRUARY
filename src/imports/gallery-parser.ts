I'm rebuilding the before & after photo gallery for a plastic surgery website. The gallery images are stored in a GitHub repo and served via a Supabase Edge Function. I need you to update the gallery parsing logic to match the new folder architecture described below.

GitHub Repo: Nesbit25/HPS-WEB-FEBRUARY
Gallery root path: /gallery/

NEW Folder Architecture
The gallery folder has 4 category subfolders: Body/, Breast/, Face/, Nose/
Inside each category folder are procedure subfolders, and inside each procedure subfolder are patient subfolders named Patient01/, Patient02/, etc.
Inside each patient folder are images named with this exact pattern:
PROCEDURE_PatientNN_BeforeN.jpg
PROCEDURE_PatientNN_AfterN.jpg
Example: BREAST_AUGMENTATION_Patient01_Before1.jpg, BREAST_AUGMENTATION_Patient01_After1.jpg
A BeforeN always pairs with its matching AfterN — Before1 goes with After1, Before2 with After2, etc. Each patient may have 1–4 view angles (i.e., up to 4 Before + 4 After images).

Full Procedure List by Category:
Breast/ (9 procedures)

breast-augmentation-photos/ → prefix BREAST_AUGMENTATION, 13 patients, 3 views each
tuberous-breast-photos/ → prefix TUBEROUS_BREAST, 6 patients, 3 views each
breast-augmentation-lift-photos/ → prefix BREAST_AUG_LIFT, 23 patients, 3 views each
breast-lift-photos/ → prefix BREAST_LIFT, 20 patients, 3 views each
explant-mastopexy/ → prefix EXPLANT_MASTOPEXY, 5 patients, 3 views each
breast-reduction-photos/ → prefix BREAST_REDUCTION, 5 patients, 3 views each
asymmetrical-breast-photos/ → prefix ASYMMETRICAL_BREAST, 7 patients, 3 views each
ftm-top-photos/ → prefix FTM_TOP, 4 patients, 3 views each
gynecomastia-photos/ → prefix GYNECOMASTIA, 7 patients, 3 views each

Body/ (5 procedures)

tummy-tuck-photos/ → prefix TUMMY_TUCK, 19 patients, 3 views each (Patient17 has 4 views)
arm-lift-photos/ → prefix ARM_LIFT, 6 patients, 1–2 views each
thigh-lift-photos/ → prefix THIGH_LIFT, 4 patients, 2 views each
body-contouring-photos/ → prefix BODY_CONTOURING, 8 patients, 3 views each
liposuction-photos-2/ → prefix BODY_LIPOSUCTION, 8 patients, 2 views each

Face/ (5 procedures)

eyelid-surgery-photos/ → prefix EYELID_SURGERY, 15 patients, 3 views each
facelift-necklift-photos/ → prefix FACELIFT_NECKLIFT, 12 patients, 3 views each
chin-augmentation-photos/ → prefix CHIN_AUGMENTATION, 5 patients, 3 views each
otoplasty-photos/ → prefix OTOPLASTY, 2 patients, 1–2 views each
liposuction-photos/ → prefix LIPOSUCTION, 12 patients, 3 views each (Patient12 has fewer)

Nose/ (1 procedure)

rhinoplasty-photos/ → prefix RHINOPLASTY, 10 patients, 3 views each (Patient10 has 2 views)


How the existing gallery parser works:
The Supabase Edge Function fetches the GitHub API tree for the /gallery/ folder, walks every file path, and parses filenames using this regex:
/^(.*)_p(\d+)_img(\d+)\.(png|jpg|jpeg)$/
This regex is outdated and needs to be updated to match the new filename format:
/^([A-Z_]+)_Patient(\d+)_(Before|After)(\d+)\.(jpg|jpeg|png)$/
Where group 1 = procedure prefix, group 2 = patient number, group 3 = Before or After, group 4 = view number.
Each unique combination of (procedure + patient number) = one gallery case/card. All Before images for that case go in a before[] array, all After images go in an after[] array, sorted by view number. The category (Body, Breast, Face, Nose) is derived from the folder path segment immediately under /gallery/.
Please update the Edge Function and gallery components to parse and display images using this new structure.