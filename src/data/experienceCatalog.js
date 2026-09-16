const text = (en, fr, ar) => ({ en, fr, ar });

const ACTIVITY_LIBRARY = {
  scenicWalk: {
    icon: 'directions_walk',
    type: 'outdoor',
    title: text('Scenic walk', 'Balade panoramique', 'نزهة بانورامية'),
    description: text(
      'Follow public paths and viewpoints at your own pace.',
      'Suivez les sentiers publics et les points de vue à votre rythme.',
      'اتبع المسارات العامة ونقاط المشاهدة بالوتيرة التي تناسبك.'
    ),
  },
  guidedHike: {
    icon: 'hiking',
    type: 'outdoor',
    title: text('Guided hike', 'Randonnée guidée', 'جولة مشي مع مرشد'),
    description: text(
      'Explore the landscape with a qualified local guide; confirm weather and route difficulty first.',
      'Explorez le paysage avec un guide local qualifié ; vérifiez d’abord météo et difficulté.',
      'استكشف المناظر مع مرشد محلي مؤهل، وتحقق أولاً من الطقس وصعوبة المسار.'
    ),
  },
  photography: {
    icon: 'photo_camera',
    type: 'creative',
    title: text('Landscape photography', 'Photographie de paysage', 'تصوير المناظر الطبيعية'),
    description: text(
      'Look for changing light, geological forms and wide viewpoints without leaving marked areas.',
      'Observez la lumière, les formes géologiques et les panoramas sans quitter les zones balisées.',
      'راقب تغير الضوء والتكوينات الجيولوجية والمناظر الواسعة دون مغادرة المناطق المحددة.'
    ),
  },
  birdwatching: {
    icon: 'flutter_dash',
    type: 'nature',
    title: text('Quiet nature observation', 'Observation calme de la nature', 'مراقبة هادئة للطبيعة'),
    description: text(
      'Observe birds and plants from a distance; avoid feeding or disturbing wildlife.',
      'Observez oiseaux et plantes à distance ; ne nourrissez pas et ne dérangez pas la faune.',
      'راقب الطيور والنباتات من بعيد، ولا تطعم الحيوانات البرية أو تزعجها.'
    ),
  },
  waterActivity: {
    icon: 'kayaking',
    type: 'outdoor',
    title: text('Water activity', 'Activité nautique', 'نشاط مائي'),
    description: text(
      'Ask a licensed local operator about boating or fishing, current conditions and safety equipment.',
      'Renseignez-vous auprès d’un opérateur local autorisé sur navigation, pêche, conditions et sécurité.',
      'اسأل مشغلاً محلياً مرخصاً عن القوارب أو الصيد والظروف الحالية ومعدات السلامة.'
    ),
  },
  picnic: {
    icon: 'park',
    type: 'family',
    title: text('Responsible picnic', 'Pique-nique responsable', 'نزهة مسؤولة'),
    description: text(
      'Use designated areas, take all waste away and protect water sources.',
      'Utilisez les zones prévues, emportez vos déchets et protégez les sources d’eau.',
      'استخدم الأماكن المخصصة وخذ نفاياتك معك واحمِ مصادر المياه.'
    ),
  },
  heritageWalk: {
    icon: 'account_balance',
    type: 'culture',
    title: text('Heritage interpretation walk', 'Balade d’interprétation patrimoniale', 'جولة لفهم التراث'),
    description: text(
      'Read the architecture and local history with a guide; access to interiors may vary.',
      'Découvrez architecture et histoire locale avec un guide ; l’accès intérieur peut varier.',
      'تعرّف على العمارة والتاريخ المحلي مع مرشد؛ وقد يختلف الدخول إلى الأماكن الداخلية.'
    ),
  },
  museumVisit: {
    icon: 'museum',
    type: 'culture',
    title: text('Museum discovery', 'Découverte du musée', 'اكتشاف المتحف'),
    description: text(
      'Connect objects, oral memory and the surrounding landscape; verify opening hours before travel.',
      'Reliez objets, mémoire orale et paysage ; vérifiez les horaires avant le départ.',
      'اربط بين المعروضات والذاكرة الشفوية والمشهد المحيط، وتحقق من أوقات الفتح قبل السفر.'
    ),
  },
  localMarket: {
    icon: 'storefront',
    type: 'culture',
    title: text('Meet local producers', 'Rencontrer les producteurs', 'لقاء المنتجين المحليين'),
    description: text(
      'Discover seasonal food and crafts, ask before photographing people, and buy directly when possible.',
      'Découvrez produits et artisanat, demandez avant de photographier et achetez directement si possible.',
      'اكتشف المنتجات والحرف، واستأذن قبل تصوير الناس، واشترِ مباشرةً متى أمكن.'
    ),
  },
  geology: {
    icon: 'landscape',
    type: 'learning',
    title: text('Geology field discovery', 'Découverte géologique', 'اكتشاف جيولوجي'),
    description: text(
      'Observe formations and fossils in place; do not collect rock, fossil or archaeological material.',
      'Observez formations et fossiles sur place ; ne prélevez ni roche, ni fossile, ni objet archéologique.',
      'راقب التكوينات والحفريات في مكانها، ولا تجمع الصخور أو الحفريات أو المواد الأثرية.'
    ),
  },
};

const CATEGORY_ACTIVITY_KEYS = {
  waterfall: ['scenicWalk', 'photography', 'birdwatching'],
  lake: ['scenicWalk', 'waterActivity', 'photography'],
  spring: ['scenicWalk', 'picnic', 'birdwatching'],
  river: ['guidedHike', 'photography', 'birdwatching'],
  nature: ['guidedHike', 'photography', 'birdwatching'],
  valley: ['guidedHike', 'localMarket', 'photography'],
  peak: ['guidedHike', 'photography', 'geology'],
  gorge: ['guidedHike', 'photography', 'geology'],
  geology: ['geology', 'guidedHike', 'photography'],
  heritage: ['heritageWalk', 'photography', 'localMarket'],
  village: ['heritageWalk', 'localMarket', 'guidedHike'],
  market: ['localMarket', 'heritageWalk', 'photography'],
  museum: ['museumVisit', 'heritageWalk', 'localMarket'],
  garden: ['scenicWalk', 'picnic', 'birdwatching'],
  park: ['scenicWalk', 'picnic', 'birdwatching'],
};

const PLACE_ACTIVITY_KEYS = {
  'poi-ouzoud-falls': ['scenicWalk', 'waterActivity', 'photography', 'birdwatching'],
  'poi-bin-el-ouidane': ['waterActivity', 'scenicWalk', 'photography', 'birdwatching'],
  'poi-imi-n-ifri': ['guidedHike', 'geology', 'photography'],
  'poi-ait-bouguemez': ['guidedHike', 'heritageWalk', 'localMarket', 'photography'],
  'poi-agadir-ait-bouguemez': ['heritageWalk', 'guidedHike', 'photography'],
  'poi-aoujgal-granaries': ['heritageWalk', 'guidedHike', 'photography'],
  'poi-mgoun-peak': ['guidedHike', 'geology', 'photography'],
  'poi-iouaridene-tracks': ['geology', 'museumVisit', 'photography'],
  'poi-marche-central-beni-mellal': ['localMarket', 'heritageWalk', 'museumVisit'],
};

export function localized(value, lang = 'en') {
  if (typeof value === 'string') return value;
  return value?.[lang] || value?.en || '';
}

export function activitiesForPoi(poi) {
  const keys =
    PLACE_ACTIVITY_KEYS[poi?.id] ||
    CATEGORY_ACTIVITY_KEYS[poi?.category] ||
    ['scenicWalk', 'photography', 'localMarket'];
  return keys.map((key) => ({ id: key, ...ACTIVITY_LIBRARY[key] })).filter(Boolean);
}

export const INTANGIBLE_HERITAGE = [
  {
    id: 'ahidous-middle-atlas',
    icon: 'music_note',
    title: text('Ahidous: poetry, rhythm and collective dance', 'Ahidous : poésie, rythme et danse collective', 'أحيدوس: الشعر والإيقاع والرقص الجماعي'),
    period: text('Living Amazigh tradition', 'Tradition amazighe vivante', 'تراث أمازيغي حي'),
    summary: text(
      'In Middle Atlas communities, sung poetry, bendir rhythms and a shoulder-to-shoulder dance express memory, solidarity and social commentary. Styles and occasions vary between communities.',
      'Dans le Moyen Atlas, poésie chantée, rythmes du bendir et danse en ligne expriment mémoire, solidarité et commentaire social. Styles et occasions varient selon les communautés.',
      'في مجتمعات الأطلس المتوسط، يجمع أحيدوس بين الشعر المغنى وإيقاع البندير والرقص الجماعي للتعبير عن الذاكرة والتضامن والحياة الاجتماعية.'
    ),
    participation: text(
      'Attend a community-authorized performance or workshop. Observe first, follow the hosts’ invitation, and ask before recording.',
      'Assistez à une représentation ou un atelier autorisé par la communauté. Observez d’abord et demandez avant d’enregistrer.',
      'احضر عرضاً أو ورشة بموافقة المجتمع، وراقب أولاً واستأذن قبل التسجيل.'
    ),
    history: text(
      'Ahidous is one of the oldest Amazigh performing arts of the Middle Atlas, born in the village life of the Zayan and neighbouring tribes. Dancers stand shoulder to shoulder in a circle or two facing lines; a poet (amdyaz) launches sung verses called izlan, the group answers, and bendir frame drums drive the pulse. For centuries it marked weddings, harvests and reconciliations — a living archive where news, praise and social critique were stored in verse. Since 2000 the National Ahidous Festival at Aïn Leuh has gathered dozens of troupes every summer (about 40 at the 25th edition in 2026), anchoring its transmission to new generations.',
      'L’ahidous est l’un des plus anciens arts amazighs du Moyen Atlas, né dans la vie villageoise des Zayanes et des tribus voisines. Les danseurs se tiennent épaule contre épaule, en cercle ou en deux lignes face à face ; un poète (amdyaz) lance des vers chantés — les izlan — auxquels le groupe répond, portés par le rythme des bendirs. Pendant des siècles il a accompagné mariages, moissons et réconciliations : une archive vivante où nouvelles, éloges et critique sociale se transmettaient en vers. Depuis 2000, le Festival national d’Ahidous d’Aïn Leuh réunit chaque été des dizaines de troupes (environ 40 pour la 25ᵉ édition en 2026) et assure sa transmission.',
      'أحيدوس من أقدم الفنون الأمازيغية في الأطلس المتوسط، نشأ في حياة قرى قبائل زيان والقبائل المجاورة. يقف الراقصون كتفاً بكتف في دائرة أو صفين متقابلين؛ يطلق الشاعر (أمدياز) أبياتاً مغناة تسمى «إزلان» فيجيبه الجمع على إيقاع البنادير. رافق لقرون الأعراس والحصاد والمصالحات، فكان أرشيفاً حياً تُحفظ فيه الأخبار والمديح والنقد الاجتماعي شعراً. ومنذ سنة 2000 يجمع المهرجان الوطني لأحيدوس بعين اللوح عشرات الفرق كل صيف (نحو 40 فرقة في الدورة 25 سنة 2026) ليضمن انتقاله للأجيال الجديدة.'
    ),
    image: '/places/poi-ajdir-plateau/1.jpg',
    videoSearch: 'Ahidous Ain Leuh festival Moyen Atlas',
    poiIds: ['poi-kasbah-moha-hammou', 'poi-ajdir-plateau', 'poi-khenifra-national-park'],
    sourceUrl: 'https://www.maroc.ma/fr/actualites/festival-national-des-arts-dahidous',
  },
  {
    id: 'collective-granaries',
    icon: 'grain',
    title: text('Collective granaries and shared stewardship', 'Greniers collectifs et gestion partagée', 'المخازن الجماعية والتدبير المشترك'),
    period: text('Centuries-old mountain practice', 'Pratique montagnarde séculaire', 'ممارسة جبلية متوارثة'),
    summary: text(
      'Fortified granaries protected harvests, valuables and documents. Their architecture also reflects collective rules, trust and adaptation to mountain risk.',
      'Les greniers fortifiés protégeaient récoltes, biens et documents. Leur architecture traduit aussi des règles collectives et l’adaptation aux risques de montagne.',
      'حمت المخازن المحصنة المحاصيل والممتلكات والوثائق، وتعكس عمارتها قواعد جماعية وقدرة على التكيف مع مخاطر الجبل.'
    ),
    participation: text(
      'Visit with a local custodian or guide, respect closed chambers and contribute to community-led conservation.',
      'Visitez avec un gardien ou guide local, respectez les espaces fermés et soutenez la conservation communautaire.',
      'زر الموقع برفقة حارس أو مرشد محلي، واحترم الغرف المغلقة وادعم الصيانة المجتمعية.'
    ),
    history: text(
      'Fortified collective granaries — ighrem or agadir in Tamazight — have dotted the Atlas since at least the medieval era, perched on crags that were easy to defend. Each family kept a locked cell for grain, oil, jewellery and legal documents, and a trusted guardian (lamin) enforced written customary law tablets. Some, like the famous hilltop granary of Sidi Moussa in the nearby Aït Bouguemez valley, double as pilgrimage sites built around a saint’s tomb. Historians describe them as some of North Africa’s oldest community banks: architecture that encodes trust, shared rules and survival through drought and conflict.',
      'Les greniers collectifs fortifiés — ighrem ou agadir en tamazight — parsèment l’Atlas depuis au moins l’époque médiévale, perchés sur des pitons faciles à défendre. Chaque famille y louait une cellule fermée pour le grain, l’huile, les bijoux et les actes ; un gardien de confiance (lamin) appliquait un droit coutumier écrit. Certains, comme le célèbre grenier de Sidi Moussa dans la vallée voisine des Aït Bouguemez, sont aussi des lieux de pèlerinage bâtis autour du tombeau d’un saint. Les historiens y voient parmi les plus anciennes « banques communautaires » d’Afrique du Nord : une architecture qui incarne la confiance, les règles partagées et la survie face aux sécheresses et aux conflits.',
      'انتشرت المخازن الجماعية المحصنة — «إغرم» أو «أكادير» بالأمازيغية — في الأطلس منذ العصور الوسطى على الأقل، فوق صخور يسهل الدفاع عنها. كانت كل أسرة تملك غرفة مقفلة للحبوب والزيت والحلي والوثائق، ويسهر أمين موثوق على تطبيق ألواح العرف المكتوبة. بعضها، مثل مخزن سيدي موسى الشهير في وادي آيت بوكماز المجاور، موقع حج أيضاً بُني حول ضريح ولي صالح. ويصفها المؤرخون بأنها من أقدم «البنوك المجتمعية» في شمال إفريقيا: عمارة تجسد الثقة والقواعد المشتركة والصمود أمام الجفاف والنزاعات.'
    ),
    image: '/places/poi-aoujgal-granaries/1.jpg',
    videoSearch: 'grenier collectif igherm Atlas Maroc Sidi Moussa',
    poiIds: ['poi-aoujgal-granaries', 'poi-agadir-ait-bouguemez', 'poi-ait-bouguemez'],
    sourceUrl: 'https://doi.org/10.21741/9781644903391-5',
  },
  {
    id: 'mountain-pastoralism',
    icon: 'pets',
    title: text('Mountain pastoral knowledge', 'Savoirs pastoraux de montagne', 'المعارف الرعوية الجبلية'),
    period: text('Seasonal living knowledge', 'Savoirs saisonniers vivants', 'معارف موسمية حية'),
    summary: text(
      'Routes, grazing calendars, weather reading and collective land rules help communities manage high-altitude environments and herds.',
      'Itinéraires, calendriers de pâturage, lecture du temps et règles foncières collectives aident à gérer les milieux d’altitude et les troupeaux.',
      'تساعد مسارات الرعي وتقويماته وقراءة الطقس وقواعد الأرض الجماعية المجتمعات على إدارة البيئات المرتفعة والقطعان.'
    ),
    participation: text(
      'Choose a community guide and avoid blocking paths, approaching herds or treating working landscapes as staged attractions.',
      'Choisissez un guide communautaire et ne bloquez pas les passages, n’approchez pas les troupeaux et ne mettez pas en scène le quotidien.',
      'اختر مرشداً من المجتمع ولا تعرقل الممرات أو تقترب من القطعان أو تتعامل مع الحياة اليومية كعرض سياحي.'
    ),
    history: text(
      'Seasonal herding in the M’Goun highlands is governed by the agdal — a centuries-old Amazigh institution in which the community closes a pasture on agreed dates so grass can regrow, then reopens it in festive collective moves of herds and families. Elders read snow cover, springs and the calendar to set routes, and disputes are settled by the customary assembly (jmaâ). Researchers worldwide study the agdal as a working model of sustainable commons management; it still shapes the summer landscape between Aït Bouguemez and the Ajdir plateau.',
      'L’élevage saisonnier des hauteurs du M’Goun est régi par l’agdal — institution amazighe séculaire par laquelle la communauté ferme un pâturage à dates convenues pour laisser l’herbe repousser, puis le rouvre lors de montées collectives et festives des troupeaux et des familles. Les anciens lisent l’enneigement, les sources et le calendrier pour fixer les itinéraires, et l’assemblée coutumière (jmaâ) règle les différends. L’agdal est étudié dans le monde entier comme modèle vivant de gestion durable des communs ; il façonne encore le paysage estival entre les Aït Bouguemez et le plateau d’Ajdir.',
      'ينظم الرعي الموسمي في مرتفعات مكون نظام «أكدال» — مؤسسة أمازيغية عريقة يغلق بها المجتمع المرعى في تواريخ متفق عليها ليتجدد العشب، ثم يفتحه في مواكب جماعية احتفالية للقطعان والأسر. يقرأ الشيوخ الثلوج والعيون والتقويم لتحديد المسارات، وتفصل الجماعة العرفية في النزاعات. ويدرس الباحثون حول العالم نظام أكدال كنموذج حي للإدارة المستدامة للموارد المشتركة، وما زال يشكل مشهد الصيف بين آيت بوكماز وهضبة أجدير.'
    ),
    image: '/places/poi-mgoun-peak/1.jpg',
    videoSearch: 'transhumance agdal Atlas Maroc bergers',
    poiIds: ['poi-mgoun-peak', 'poi-ait-bouguemez', 'poi-ajdir-plateau'],
    sourceUrl: 'https://www.unesco.org/en/iggp/geoparks/mgoun',
  },
  {
    id: 'tbourida',
    icon: 'sports_score',
    title: text('Tbourida equestrian art', 'Art équestre de la Tbourida', 'فن التبوريدة'),
    period: text('UNESCO Representative List, 2021', 'Liste représentative UNESCO, 2021', 'القائمة التمثيلية لليونسكو، 2021'),
    summary: text(
      'A sorba of riders performs a synchronized ceremonial parade, combining horsemanship, dress, oral transmission and a coordinated blank-powder finale.',
      'Une sorba de cavaliers exécute une parade cérémonielle synchronisée associant équitation, costumes, transmission orale et salve finale à blanc.',
      'تؤدي السربة عرضاً احتفالياً متزامناً يجمع الفروسية واللباس والنقل الشفوي وطلقة جماعية بالبارود الخالي.'
    ),
    participation: text(
      'Watch only in an organized event from the designated safety area. Never enter the course or handle weapons.',
      'Assistez uniquement dans un événement organisé depuis la zone de sécurité. N’entrez jamais sur la piste et ne manipulez pas les armes.',
      'شاهد العرض فقط ضمن فعالية منظمة ومن منطقة الأمان، ولا تدخل المضمار أو تلمس الأسلحة.'
    ),
    history: text(
      'Tbourida traces back to the sixteenth century, re-enacting Arab-Amazigh cavalry charges; its name comes from “baroud”, gunpowder. A troupe (sorba) of 15 to 25 riders first performs the hadda — a saluting parade with an acrobatic rifle drill — then the talqa: a full gallop closed by a single, perfectly synchronized blank volley. Costumes, saddlery and rifles pass down within families, sustaining whole crafts of saddlers, embroiderers and blacksmiths. UNESCO inscribed tbourida on the Representative List of the Intangible Cultural Heritage of Humanity in 2021, and Morocco today counts more than 300 registered troupes.',
      'La tbourida remonte au XVIᵉ siècle et rejoue les charges de cavalerie arabo-amazighes ; son nom vient de « baroud », la poudre. Une troupe (sorba) de 15 à 25 cavaliers exécute d’abord la hadda — parade de salut avec maniement acrobatique du fusil — puis la talqa : un galop conclu par une salve à blanc unique et parfaitement synchronisée. Costumes, sellerie et fusils se transmettent en famille, faisant vivre selliers, brodeurs et forgerons. L’UNESCO a inscrit la tbourida sur la Liste représentative du patrimoine culturel immatériel de l’humanité en 2021 ; le Maroc compte aujourd’hui plus de 300 troupes affiliées.',
      'تعود التبوريدة إلى القرن السادس عشر، وتعيد تمثيل هجمات الفرسان العربية الأمازيغية؛ واسمها مشتق من «البارود». تؤدي السربة (15 إلى 25 فارساً) أولاً «الحدة» — استعراض تحية مع حركات بهلوانية بالبنادق — ثم «الطلقة»: عدوٌ بأقصى سرعة يُختم بطلقة بارود واحدة متزامنة تماماً. تتوارث الأسر الأزياء والسروج والبنادق، فتحيا بذلك حرف السراجين والمطرزين والحدادين. سجلت اليونسكو التبوريدة سنة 2021 في القائمة التمثيلية للتراث الثقافي غير المادي للإنسانية، ويضم المغرب اليوم أكثر من 300 سربة مسجلة.'
    ),
    image: '/places/poi-kasbah-tadla/1.jpg',
    videoSearch: 'Tbourida Morocco UNESCO fantasia',
    poiIds: ['poi-kasbah-tadla', 'poi-kasbah-moha-hammou', 'poi-marche-central-beni-mellal'],
    sourceUrl: 'https://ich.unesco.org/en/RL/tbourida-01483',
  },
  {
    id: 'weaving-craft',
    icon: 'texture',
    title: text('Amazigh weaving and natural-dye knowledge', 'Tissage amazigh et savoirs des teintures', 'النسيج الأمازيغي ومعارف الصباغة'),
    period: text('Living household and cooperative craft', 'Art vivant des foyers et coopératives', 'حرفة حية في البيوت والتعاونيات'),
    summary: text(
      'Wool preparation, loom work, motifs and colour choices carry practical skill and family or community memory. Techniques differ across valleys and tribes.',
      'Préparation de la laine, métier, motifs et couleurs portent savoir-faire et mémoire familiale ou communautaire. Les techniques varient selon vallées et tribus.',
      'يحمل إعداد الصوف والعمل على المنسج والزخارف والألوان مهارات عملية وذاكرة أسرية أو جماعية، وتختلف التقنيات بين المناطق.'
    ),
    participation: text(
      'Book a cooperative workshop, pay the stated price, credit the maker and ask before copying or photographing patterns.',
      'Réservez un atelier en coopérative, payez le prix annoncé, créditez l’artisane et demandez avant de copier ou photographier les motifs.',
      'احجز ورشة لدى تعاونية وادفع السعر المعلن واذكر اسم الصانعة واستأذن قبل نسخ الزخارف أو تصويرها.'
    ),
    history: text(
      'In Atlas households weaving has been women’s high art for centuries. Wool from the family flock is washed, carded and spun, dyed with madder, henna, walnut bark or saffron, then woven on a vertical loom traditionally raised with a blessing. The motifs — diamonds, chevrons and tattoo-like symbols — form a visual language of protection and belonging, read like a signature of the weaver’s valley and tribe, and transmitted from mother to daughter. Today village cooperatives across Aït Bouguemez and the Azilal highlands keep the craft alive and sell directly to travelers, giving weavers an income in their own name.',
      'Dans les foyers de l’Atlas, le tissage est depuis des siècles le grand art des femmes. La laine du troupeau familial est lavée, cardée et filée, teinte à la garance, au henné, au brou de noix ou au safran, puis tissée sur un métier vertical que l’on dresse traditionnellement avec une bénédiction. Les motifs — losanges, chevrons, symboles proches des tatouages — forment un langage visuel de protection et d’appartenance, lisible comme la signature d’une vallée et d’une tribu, transmis de mère en fille. Aujourd’hui, les coopératives villageoises des Aït Bouguemez et du haut pays d’Azilal font vivre ce savoir-faire et vendent directement aux voyageurs.',
      'كان النسيج ولا يزال منذ قرون فنّ النساء الرفيع في بيوت الأطلس. يُغسل صوف قطيع الأسرة ويُندف ويُغزل، ثم يُصبغ بالفوة والحناء وقشور الجوز والزعفران، ويُنسج على منسج عمودي يُنصب تقليدياً بالبركة والدعاء. تشكل الزخارف — المعينات والأسهم ورموز شبيهة بالوشم — لغة بصرية للحماية والانتماء تُقرأ كتوقيع لوادي الناسجة وقبيلتها، وتنتقل من الأم إلى الابنة. واليوم تحافظ التعاونيات القروية في آيت بوكماز ومرتفعات أزيلال على هذه الحرفة وتبيع مباشرة للزوار.'
    ),
    image: '/places/poi-musee-azilal/1.jpg',
    videoSearch: 'tissage tapis amazigh Atlas Maroc coopérative',
    poiIds: ['poi-ait-bouguemez', 'poi-marche-central-beni-mellal', 'poi-musee-azilal'],
    sourceUrl: 'https://ich.unesco.org/en/state/morocco-MA',
  },
  {
    id: 'geopark-oral-memory',
    icon: 'record_voice_over',
    title: text('Oral memory of land and water', 'Mémoire orale de la terre et de l’eau', 'الذاكرة الشفوية للأرض والماء'),
    period: text('Intergenerational local knowledge', 'Savoirs locaux intergénérationnels', 'معارف محلية بين الأجيال'),
    summary: text(
      'Place names, stories and practical knowledge connect springs, dinosaur tracks, routes and geological forms to community memory.',
      'Toponymes, récits et savoirs pratiques relient sources, traces de dinosaures, chemins et formes géologiques à la mémoire locale.',
      'تربط أسماء الأماكن والحكايات والمعارف العملية بين العيون وآثار الديناصورات والمسارات والتكوينات الجيولوجية والذاكرة المحلية.'
    ),
    participation: text(
      'Use geopark interpretation centres and local guides. Treat oral accounts as attributed knowledge, not anonymous content to extract.',
      'Passez par les maisons du géoparc et les guides locaux. Citez les récits au lieu de les extraire comme contenus anonymes.',
      'استعن بمراكز تفسير الجيوبارك والمرشدين المحليين، وانسب الروايات إلى أصحابها بدلاً من اقتطاعها كمحتوى مجهول.'
    ),
    history: text(
      'Before written records, knowledge in these mountains traveled by voice: Amazigh place names describing water and rock, genealogies, and legends layered over the landscape. The giant dinosaur footprints at Iouaridene were long explained by villagers as the tracks of a giant camel or of mythical beings — stories that kept the site remembered and respected for generations before palaeontologists mapped it. The UNESCO-recognized M’Goun Geopark now works with communities to record these narratives, presenting geology and the tales people told about it side by side in its interpretation houses.',
      'Avant l’écrit, le savoir de ces montagnes voyageait par la voix : toponymes amazighs décrivant l’eau et la roche, généalogies et légendes déposées sur le paysage. Les empreintes géantes de dinosaures d’Iouaridene ont longtemps été expliquées par les villageois comme les traces d’un chameau géant ou d’êtres mythiques — des récits qui ont fait mémoriser et respecter le site des générations avant que les paléontologues ne le cartographient. Le géoparc du M’Goun, reconnu par l’UNESCO, enregistre aujourd’hui ces récits avec les communautés et les présente dans ses maisons d’interprétation, aux côtés de la géologie.',
      'قبل التدوين، كانت المعرفة في هذه الجبال تنتقل صوتاً: أسماء أماكن أمازيغية تصف الماء والصخر، وأنساب، وأساطير تغطي المشهد. فآثار أقدام الديناصورات العملاقة في إيواريدن فسّرها القرويون طويلاً بأنها آثار جمل عملاق أو كائنات خرافية — حكايات حفظت الموقع في الذاكرة وصانته أجيالاً قبل أن يرسمه علماء الحفريات. ويعمل جيوبارك مكون المعترف به من اليونسكو اليوم مع المجتمعات على تسجيل هذه الروايات وعرضها في بيوت التفسير جنباً إلى جنب مع الجيولوجيا.'
    ),
    image: '/places/poi-maison-geoparc-iouaridene/1.jpg',
    videoSearch: 'Geoparc Mgoun Iouaridene dinosaur tracks Azilal',
    poiIds: ['poi-iouaridene-tracks', 'poi-maison-geoparc-iouaridene', 'poi-maison-geoparc-bouguemez', 'poi-maison-geoparc-ahansal'],
    sourceUrl: 'https://www.unesco.org/en/iggp/geoparks/mgoun',
  },
];

export const NEIGHBOURING_HERITAGE_NOTE = {
  title: text(
    'Imilchil engagement moussem — neighbouring High Atlas context',
    'Moussem des fiançailles d’Imilchil — contexte voisin du Haut Atlas',
    'موسم الخطوبة بإملشيل — سياق مجاور في الأطلس الكبير'
  ),
  body: text(
    'The gathering is held around Imilchil and Bouzmou in Midelt province, outside Béni Mellal–Khénifra. It is a community, music and trade gathering where some marriage contracts are formalized—not a “bride market”. Dates change and must be confirmed with organizers.',
    'Le rassemblement se tient autour d’Imilchil et Bouzmou, province de Midelt, hors Béni Mellal–Khénifra. C’est un moussem communautaire, musical et commercial où certains mariages sont officialisés — pas un « marché aux mariées ». Les dates doivent être confirmées.',
    'يقام الموسم حول إملشيل وبوزمو في إقليم ميدلت، خارج جهة بني ملال–خنيفرة. وهو تجمع مجتمعي وموسيقي وتجاري تُوثق فيه بعض عقود الزواج، وليس «سوقاً للعرائس». يجب تأكيد المواعيد مع المنظمين.'
  ),
  videoSearch: 'moussem Imilchil fiançailles festival',
  sourceUrl: 'https://mwnlifestyle.com/2025/09/22/imilchil-wraps-2025-betrothal-moussem-mountain-music-festival/',
};

export function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
