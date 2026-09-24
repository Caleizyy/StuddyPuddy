# StuddyPuddy

Kursinio darbo I dalis: projektavimo dokumentas

## 1. Problema ir idėja

**Sistema vienu sakiniu:** Studentams skirta sistema, kuri padeda planuoti mokymąsi, automatiškai nustato mokymosi užduočių prioritetus pagal jų terminus ir apimtį bei pasiūlo, kada ir kokias užduotis atlikti.

**Problema ir dabartinis procesas:** Studentai vienu metu turi atlikti daug skirtingų užduočių: namų darbus, pasiruošti kontroliniams, egzaminams, atlikti laboratorinius darbus ar išmokti tam tikrą mokymosi medžiagos kiekį. Šiuo metu tokios užduotys dažnai planuojamos naudojant kalendorius, užrašų programas, popierinius užrašus arba tiesiog įsimenant artėjančius terminus.

Pagrindinė problema yra ta, kad paprastas užduočių sąrašas neparodo, kurią užduotį reikėtų atlikti pirmiausia. Pavyzdžiui, užduotis gali būti pateikiama tik po savaitės, tačiau jai atlikti gali reikėti 8 valandų, o kita užduotis turi būti pateikta rytoj ir užtruks tik 1 valandą. Studentui reikia pačiam įvertinti šias aplinkybes ir susidaryti mokymosi planą.

Darome prielaidą, kad studentai užduotis dažnai planuoja individualiai ir neturi automatinio mechanizmo, kuris įvertintų užduoties terminą, apimtį ir numatomą atlikimo laiką kartu.

**Nauda:** Sistema leis studentui vienoje vietoje matyti artėjančias mokymosi užduotis ir jų prioritetus. Pagrindinė nauda – sumažėjęs laikas, kurį reikia skirti planavimui, bei aiškesnis supratimas, ką reikėtų atlikti pirmiausia.

Sistema taip pat galės išskaidyti didesnes užduotis į mažesnius mokymosi veiksmus ir pasiūlyti jų atlikimo seką, todėl studentui bus lengviau išvengti situacijos, kai didelė užduotis paliekama paskutinei dienai.

**Naudotojai:** Pagrindiniai sistemos naudotojai yra studentai.

Naudotojas galės:

- užsiregistruoti ir prisijungti prie sistemos;
- sukurti naują mokymosi užduotį;
- nurodyti užduoties kategoriją;
- nurodyti terminą;
- nurodyti, kiek modulių / temų reikia atlikti;
- įvertinti, kiek laiko reikės užduočiai atlikti;
- peržiūrėti artėjančias užduotis;
- redaguoti užduoties informaciją;
- keisti užduoties atlikimo būseną;
- pažymėti užduotį kaip atliktą / atsiskaitytą;
- gauti automatiškai sudarytą prioritetų sąrašą;
- gauti rekomenduojamą mokymosi planą.

**Prielaidos:**

- Daroma prielaida, kad naudotojas teisingai įveda užduoties terminą ir numatomą atlikimo laiką.
- Daroma prielaida, kad naudotojas nurodo, kiek mokymosi modulių ar temų sudaro užduotį.
- Daroma prielaida, kad planavimo metu sistema turi informaciją apie naudotojo turimą mokymosi laiką.
- Pradiniame prototipe planavimas bus atliekamas pagal iš anksto nustatytas taisykles, o ne pagal individualiai išmoktas naudotojo elgsenos tendencijas.

## 2. Apimtis

| Funkcija                           | Ką naudotojas galės atlikti                                                                                                                   | Pagrindinis modulis ar pagalbinė funkcija |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Užduočių valdymas                  | Sukurti, redaguoti, peržiūrėti ir užbaigti mokymosi užduotis, nurodant kategoriją, terminą, modulių skaičių ir numatomą atlikimo laiką.       | Pagalbinė funkcija                        |
| Užduočių prioritetų apskaičiavimas | Sistema pagal užduoties terminą, likusį laiką ir numatomą darbo kiekį nustatys, kurioms užduotims turėtų būti teikiamas didesnis prioritetas. | Pagrindinis modulis                       |
| Mokymosi plano sudarymas           | Sistema pagal apskaičiuotus prioritetus ir naudotojo turimą mokymosi laiką pasiūlys, kokias užduotis ir kada atlikti.                         | Pagrindinis modulis                       |
| Dashboard                          | Naudotojas matys artėjančias užduotis, jų prioritetus ir rekomenduojamą mokymosi planą.                                                       | Pagalbinė funkcija                        |
| Užduočių kategorijos               | Užduotims bus galima priskirti kategoriją, pavyzdžiui, namų darbas, egzaminas, kontrolinis ar laboratorinis darbas.                           | Pagalbinė funkcija                        |

**Į kursinio darbo apimtį neįeina:**

- pilnavertė socialinė funkcija, leidžianti dalintis planais su kitais studentais;
- dėstytojų ar universitetų administravimo sistema;
- automatinis užduočių gavimas iš universitetinių sistemų;
- mobiliosios aplikacijos versijos kūrimas, jei pagrindinis prototipas bus kuriamas kaip internetinė sistema;
- sudėtingas AI modelio mokymas pagal didelį realių studentų duomenų rinkinį;
- automatinis naudotojo tvarkaraščio importavimas iš visų galimų universitetinių sistemų.

## 3. Pagrindinis modulis

**Pavadinimas ir atsakomybė:** Mokymosi prioritetų ir plano sudarymo modulis.

Modulio atsakomybė – pagal naudotojo pateiktas užduotis įvertinti jų skubumą ir darbo apimtį, nustatyti prioritetus bei pagal juos sudaryti rekomenduojamą mokymosi planą.

Pagrindinis tikslas – ne tik surikiuoti užduotis pagal terminą, bet įvertinti kelis parametrus kartu ir nustatyti, kurioms užduotims naudotojas turėtų skirti savo turimą laiką.

**Logika, kurią reikės projektuoti ir testuoti:** Modulis turės:

- apskaičiuoti, kiek laiko liko iki kiekvienos užduoties termino;
- įvertinti užduoties darbo apimtį pagal naudotojo nurodytą modulių skaičių ir numatomą atlikimo laiką;
- apskaičiuoti užduoties prioritetą;
- surikiuoti užduotis pagal prioritetą;
- paskirstyti turimą mokymosi laiką aukštesnio prioriteto užduotims;
- atsižvelgti į užduoties atlikimo būseną;
- atnaujinti prioritetus ir mokymosi planą, kai naudotojas pakeičia užduoties duomenis arba jos būseną;
- nustatyti situacijas, kai visų užduočių iki terminų atlikti neįmanoma.

**Įvestis:** Moduliui reikės šių duomenų:

- užduoties pavadinimas;
- kategorija;
- galutinis terminas;
- modulių / temų skaičius;
- numatomas bendras atlikimo laikas;
- užduoties atlikimo būsena;
- naudotojo turimas mokymosi laikas konkrečiomis dienomis.

Konkretaus įvesties pavyzdys:

Matematikos egzaminas – kategorija „Egzaminas“, liko 4 dienos, reikia išmokti 6 temas, numatomas mokymosi laikas – 8 valandos.
Programavimo laboratorinis darbas – kategorija „Laboratorinis“, liko 2 dienos, numatomas atlikimo laikas – 3 valandos.

**Išvestis:** Modulis pateiks:

- surikiuotą neužbaigtų užduočių sąrašą pagal prioritetą;
- kiekvienos užduoties prioritetą;
- rekomenduojamą mokymosi laiką;
- rekomenduojamą užduoties atlikimo dieną / laiką;
- įspėjimą, jei pagal turimą laiką visų užduočių iki terminų atlikti nepavyks.
- atnaujintą mokymosi planą, jei naudotojas pakeitė užduoties duomenis arba jos būseną.

Konkretaus rezultato pavyzdys:

- Programavimo laboratorinis – aukštas prioritetas – šiandien skirti 1,5 val.
- Matematikos egzaminas – aukštas prioritetas – šiandien skirti 2 val.
- Fizikos namų darbas – vidutinis prioritetas – rytoj skirti 1 val.

Jeigu studentas pažymi programavimo laboratorinį darbą kaip atliktą, ši užduotis pašalinama iš būsimų mokymosi plano veiksmų, o likusių užduočių planas perskaičiuojamas.

**Veikimo eiga:**

1. Naudotojas įveda arba atnaujina mokymosi užduotis.
2. Sistema patikrina, ar visi būtini duomenys yra tinkami.
3. Sistema patikrina kiekvienos užduoties atlikimo būseną.
4. Kiekvienai neužbaigtai užduočiai apskaičiuojamas laikas iki termino.
5. Įvertinamas užduoties darbo kiekis pagal numatomą atlikimo laiką ir modulių skaičių.
6. Pagal nustatytas taisykles apskaičiuojamas užduoties prioritetas.
7. Užduotys surikiuojamos pagal prioritetą.
8. Sistema patikrina naudotojo turimą mokymosi laiką.
9. Turimas laikas paskirstomas aukštesnio prioriteto užduotims.
10. Sistema sugeneruoja rekomenduojamą mokymosi planą.
11. Jei naudotojas pakeičia užduoties duomenis arba jos būseną, sistema perskaičiuoja susijusius prioritetus ir mokymosi planą.
12. Jei visų užduočių iki terminų atlikti neįmanoma, naudotojui pateikiamas įspėjimas.

### Taisyklės arba sprendimo žingsniai

1. Skubumo taisyklė - Kuo mažiau laiko liko iki užduoties termino, tuo didesnis užduoties prioritetas. Užduotis, kurios terminas yra rytoj, turi būti vertinama kaip skubesnė už užduotį, kurios terminas yra po savaitės, jei kitų parametrų skirtumas nėra pakankamas prioritetui pakeisti.
2. Darbo apimties taisyklė - Vertinant užduoties prioritetą atsižvelgiama į numatomą atlikimo laiką. Didesnės trukmės užduotis turi būti pradėta anksčiau, kad visas reikalingas laikas būtų paskirstytas iki termino.
3. Nepakankamo laiko taisyklė - Jeigu iki užduoties termino likęs naudotojo laisvas mokymosi laikas yra mažesnis už užduočiai reikalingą laiką, sistema turi pažymėti užduotį kaip rizikingą ir parodyti įspėjimą.
4. Plano paskirstymo taisyklė - Sistema pirmiausia skiria turimą mokymosi laiką aukštesnio prioriteto užduotims, tačiau turi užtikrinti, kad nebūtų viršytas konkrečiai dienai naudotojo nurodytas mokymosi laikas.
5. Atliktos užduoties taisyklė – atlikta / atsiskaityta užduotis neturi būti įtraukiama į būsimą mokymosi planą. Pasikeitus užduoties būsenai, likusių užduočių planas turi būti perskaičiuojamas.

### Scenarijai būsimiems testams

| Scenarijus                        | Pradinės sąlygos ir konkreti įvestis                                                                                                                                                                              | Veiksmas                                                | Tikslus laukiamas rezultatas                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Įprastas atvejis                  | Yra 3 užduotys: programavimo laboratorinis – terminas po 2 dienų, 3 val.; matematikos egzaminas – po 5 dienų, 6 val.; istorijos namų darbas – po 7 dienų, 2 val. Naudotojas turi 2 val. mokymosi laiko per dieną. | Naudotojas paleidžia plano sudarymą.                    | Sistema apskaičiuoja prioritetus, laboratoriniam darbui suteikia didesnį prioritetą dėl artimesnio termino, o mokymosi laiką paskirsto taip, kad užduotys būtų atliekamos iki jų terminų.   |
| Ribinis atvejis arba konfliktas   | Dvi užduotys turi tą patį terminą. Pirma užduotis trunka 1 val., antra – 8 val. Naudotojas turi tik 4 val. mokymosi laiko iki termino.                                                                            | Naudotojas paleidžia plano sudarymą.                    | Sistema turi nustatyti, kad iki termino viso darbo atlikti nepakanka laiko, aukštesnį prioritetą skirti skubesnei / didesnės rizikos užduočiai ir parodyti įspėjimą apie nepakankamą laiką. |
| Klaida arba neįmanomas rezultatas | Užduotis neturi galutinio termino arba numatomas atlikimo laikas yra 0 val. / neigiamas.                                                                                                                          | Naudotojas bando išsaugoti užduotį arba sudaryti planą. | Sistema neleidžia naudoti netinkamų duomenų planavimui ir parodo aiškų klaidos pranešimą, nurodantį, kokį lauką reikia pataisyti.                                                           |
| Užduoties būsenos pakeitimas      | Yra 3 neužbaigtos užduotys, sudarytas mokymosi planas. Naudotojas vieną užduotį pažymi kaip atliktą.                                                                                                              | Naudotojas pakeičia užduoties būseną į „Atlikta“.       | Atlikta užduotis pašalinama iš būsimo plano, o sistema perskaičiuoja likusių užduočių mokymosi planą.                                                                                       |

**Jei modulis naudoja AI:** Nenaudoja

## 4. Kokybės atributas

**Pasirinktas atributas:** Teisingumas

**Kodėl svarbus šiai sistemai:** Study Planner pagrindinė funkcija yra padėti naudotojui priimti sprendimą, kokias mokymosi užduotis atlikti pirmiausia. Todėl neteisingai apskaičiuotas prioritetas arba netinkamai paskirstytas mokymosi laikas gali lemti tai, kad svarbi užduotis bus pradėta per vėlai. Kadangi pagrindinis sistemos tikslas yra automatiškai generuoti rekomendaciją, jos rezultatas turi būti nuspėjamas ir atitikti iš anksto apibrėžtas taisykles.

**Tikrinimo scenarijus ir sąlygos:** Bus sudarytas testinių užduočių rinkinys su skirtingais:

terminais;
atlikimo trukmėmis;
modulių skaičiais;
naudotojo turimo laiko kiekiais;
užduočių tarpusavio konfliktais.

Bus tikrinama, ar sistema kiekvienu atveju taiko nustatytas prioritetų ir laiko paskirstymo taisykles.

**Sėkmės kriterijus:** Visuose iš anksto apibrėžtuose testuose sistema turi grąžinti rezultatą, atitinkantį nustatytas verslo taisykles. Taip pat sistema neturi sudaryti plano, kuriame konkrečiai dienai paskirtas mokymosi laikas viršytų naudotojo nurodytą maksimalų laiką.

**Numatytas projektavimo sprendimas:** Prioritetų skaičiavimą ir plano sudarymą planuojama atskirti nuo naudotojo sąsajos. Verslo taisyklės bus realizuotos atskirame pagrindiniame modulyje, todėl jas bus galima testuoti nepriklausomai nuo vartotojo sąsajos. Kiekvienai taisyklei bus numatyti atskiri testai, įskaitant įprastus ir ribinius atvejus.

**Kaip patikrinsiu vėlesniame etape:** Bus naudojami automatiniai vienetiniai testai pagrindinėms prioritetų skaičiavimo ir plano sudarymo taisyklėms. Papildomai bus atliekamas integracinis testas, kuriame užduotys bus įvedamos per sistemos sąsają ir patikrinama, ar sugeneruotas planas atitinka pagrindinio modulio rezultatą. Galiausiai, bus praeiti visi numatyti pakeitimai ranka įsitikinti, kad viskas veikia sklandžiai ir pagal nustatytas taisykles

**Sprendimo kaina arba ribojimas:** Didesnis taisyklių kiekis padidins pagrindinio modulio sudėtingumą ir testavimo apimtį. Taip pat taisyklėmis paremtas planavimas gali ne visada atitikti individualius skirtingų studentų mokymosi įpročius.

**Pasirinktas antras atributas:** Saugumas

**Kodėl svarbus šiai sistemai:** Sistemoje bus saugomi vartotojų prisijungimo duomenys, užduotys, terminai ir asmeniniai mokymosi planai. Todėl svarbu užtikrinti, kad vienas naudotojas negalėtų pasiekti kito naudotojo duomenų.

**Tikrinimo scenarijus ir sąlygos:** Bus naudojamos bent dvi skirtingos naudotojų paskyros. Kiekvienas naudotojas sukurs savo užduotis ir mokymosi planą. Bus tikrinama, ar prisijungęs naudotojas gali pasiekti tik savo duomenis ir ar negali gauti kito naudotojo užduočių pakeisdamas užklausos parametrus.

**Sėkmės kriterijus:** Naudotojas gali pasiekti, sukurti, redaguoti ir ištrinti tik savo duomenis. Neprisijungęs naudotojas negali pasiekti apsaugotų sistemos funkcijų ar kito naudotojo duomenų.

**Numatytas projektavimo sprendimas:** Naudotojo autentifikavimas bus realizuojamas backend'e. Užduotys ir mokymosi planai bus susiejami su konkrečiu naudotoju, o backend kiekvienos užklausos metu tikrins naudotojo teises pasiekti prašomus duomenis.

**Kaip patikrinsiu vėlesniame etape:** Bus atliekami autentifikacijos ir autorizacijos testai su keliomis paskyromis. Bus tikrinamas prisijungimas su teisingais ir neteisingais duomenimis, bandymai pasiekti ne savo duomenis bei apsaugotų funkcijų naudojimas neprisijungus.

**Sprendimo kaina arba ribojimas:** Autentifikacijos ir autorizacijos įgyvendinimas padidins backend sudėtingumą ir pareikalaus papildomų testų. Taip pat reikės tinkamai saugoti prisijungimo informaciją ir užtikrinti, kad naudotojo duomenys nebūtų atskleidžiami kitiems naudotojams.

## 5. Pradinė sistemos struktūra

### Paprasta schema

Planuojama tokia pradinė sistemos struktūra:

Naudotojas
|
V
React vartotojo sąsaja + shadcn/ui ir Tailwind CSS
|
V
Node.js backend / REST API
|
V
MongoDB duomenų bazė

| Sistemos dalis | Atsakomybė                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| React          | Vartotojo sąsaja, užduočių kūrimas ir atvaizdavimas, prioritetų bei mokymosi plano pateikimas.                       |
| Tailwind CSS   | React vartotojo sąsajos stilizavimas ir elementų išdėstymas. Naudojamas kartu su shadcn/ui komponentais.             |
| shadcn/ui      | Paruošti ir pritaikomi vartotojo sąsajos komponentai, tokie kaip formos, mygtukai, kortelės ir kiti UI elementai.    |
| Node.js        | Backend, REST API ir pagrindinė sistemos verslo logika, įskaitant prioritetų skaičiavimą ir mokymosi plano sudarymą. |
| MongoDB        | Užduočių ir kitų sistemos duomenų saugojimas.                                                                        |
| Git / GitHub   | Projekto versijų kontrolė ir kodo saugojimas.                                                                        |

**Planuojamos technologijos ir pasirinkimo priežastys:** Frontend bus kuriamas naudojant React, nes jis leidžia komponentais struktūrizuoti vartotojo sąsają ir patogiai atnaujinti joje rodomus duomenis. Tailwind CSS bus naudojamas sąsajos stilizavimui ir išdėstymui, o shadcn/ui – paruoštiems ir lengvai pritaikomiems UI komponentams. Backend bus kuriamas naudojant Node.js, nes jis leidžia realizuoti REST API ir pagrindinę sistemos verslo logiką naudojant JavaScript ekosistemą. MongoDB pasirinkta duomenų saugojimui, nes sistemoje saugomi objektai, tokie kaip užduotys ir mokymosi planai, gali būti saugomi lanksčia dokumentų struktūra. Git / GitHub bus naudojami projekto versijų kontrolei.

## 6. AI panaudojimas

### AI rengiant šį dokumentą

Rengiant šį dokumentą AI buvo naudojamas kaip pagalbinė priemonė idėjoms struktūrizuoti, formuluotėms tobulinti ir dokumento turiniui patikrinti.

### Planuojamas AI naudojimas kuriant sistemą

**Kur ir kam naudosiu AI:** AI planuojama naudoti kaip pagalbinę priemonę kuriant programinį kodą, generuojant testų idėjas, ieškant galimų klaidų, ribinių atvejų ir pavojingų vietų.

**Kaip tikrinsiu pasiūlymus ir sugeneruotą kodą:** AI sugeneruotas kodas bus peržiūrimas ir naudojamas tik įsitikinus, kad suprantu, ką AI parašė ir kodėl kodas buvo sugeneruotas būtent taip. Sugeneruotas kodas bus papildomai tikrinamas paleidžiant programą ir atliekant testus.

**Ar AI bus sistemos funkcionalumo dalis:** Neplanuojama

## 7. Tolesnių darbų planas

| Darbas                                   | Apčiuopiamas rezultatas                                                                                                                                                                  | Planuojama darbų seka                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registracija ir prisijungimas            | Veikianti vartotojo registracijos ir prisijungimo funkcija, leidžianti kiekvienam studentui naudotis savo paskyra.                                                                       | 1. Sukurti vartotojo duomenų struktūrą MongoDB. 2. Sukurti registracijos ir prisijungimo API Node.js backend'e. 3. Sukurti registracijos ir prisijungimo formas React frontend'e, naudojant Tailwind CSS ir shadcn/ui. 4. Ištestuoti registraciją, prisijungimą ir neteisingų duomenų atvejus. |
| Užduočių kūrimas ir valdymas             | Veikianti funkcija, leidžianti prisijungusiam studentui sukurti, peržiūrėti, redaguoti ir užbaigti savo užduotis.                                                                        | 1. Sukurti užduočių API backend'e. 2. Prijungti užduotis prie prisijungusio vartotojo ir MongoDB. 3. Sukurti React formas ir užduočių atvaizdavimą naudojant Tailwind CSS ir shadcn/ui. 4. Ištestuoti užduoties sukūrimą, redagavimą ir būsenos pakeitimą.                                     |
| Užduočių prioriteto skaičiavimo funkcija | Backend funkcija, apskaičiuojanti užduoties prioritetą, ir frontend dalis, rodanti apskaičiuotą prioritetą.                                                                              | 1. Įgyvendinti prioriteto skaičiavimo taisykles backend'e. 2. Prijungti funkciją prie API. 3. Atvaizduoti prioritetą frontend'e. 4. Parašyti ir atlikti testus su skirtingais terminais, trukmėmis ir konfliktais.                                                                             |
| Personalizuoto mokymosi plano sudarymas  | Backend funkcija, sudaranti mokymosi planą pagal užduočių prioritetus, terminus, trukmę ir konkretaus naudotojo turimą mokymosi laiką, bei frontend dalis, rodanti rekomenduojamą planą. | 1. Įgyvendinti plano sudarymo logiką backend'e. 2. Prijungti ją prie naudotojo turimų duomenų ir užduočių. 3. Sukurti plano atvaizdavimą frontend'e. 4. Parašyti testus su skirtingu laisvu laiku, užduočių apkrova ir užduočių būsenomis.                                                     |
| Dashboard ir sistemos integravima        | Pagrindinis React langas, kuriame prisijungęs studentas mato savo užduotis, jų būsenas, prioritetus ir mokymosi planą.                                                                   | 1. Sukurti dashboard struktūrą. 2. Sujungti jau sukurtas backend funkcijas. 3. Sutvarkyti sąsają naudojant Tailwind CSS ir shadcn/ui. 4. Atlikti integracinius testus ir patikrinti visą vartotojo veiksmų seką.                                                                               |

**Būsimo prototipo veikimo scenarijus:** Studentas užsiregistruoja sistemoje arba prisijungia prie jau sukurtos paskyros. Prisijungęs studentas sukuria kelias užduotis, nurodydamas jų kategoriją, terminą, temų skaičių ir numatomą atlikimo laiką. Taip pat nurodo, kiek laiko gali skirti mokymuisi skirtingomis dienomis. Sistema išsaugo užduotis konkretaus vartotojo paskyroje, apskaičiuoja jų prioritetus ir sudaro personalizuotą mokymosi planą. Studentas vėliau gali pakeisti užduoties informaciją arba pažymėti ją kaip atliktą. Sistema pagal pasikeitusius duomenis perskaičiuoja prioritetus ir atnaujina mokymosi planą. Dashboard'e studentas mato aktualias užduotis, jų būsenas, prioritetus ir rekomenduojamą atlikimo laiką.

| Rizika arba neaiškumas                                                                      | Kaip patikrinsiu arba sumažinsiu                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gali kilti problemų atskiriant skirtingų vartotojų duomenis.                                | Testuosiu su keliomis paskyromis ir tikrinsiu, ar kiekvienas vartotojas mato tik savo užduotis ir mokymosi planą.                                                                                                                                                                                                                                                                                                                                                                                              |
| Gali būti neaišku, kaip tiksliai suderinti termino ir užduoties apimties įtaką prioritetui. | Išbandysiu skirtingus užduočių scenarijus ir palyginsiu rezultatus su nustatytomis prioriteto taisyklėmis.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Gali būti sunku sukurti personalizuotą mokymosi planą                                       | Pradžioje personalizavimą apribosiu aiškiai apibrėžtais kriterijais: studento turimu laiku kiekvieną dieną, užduočių prioritetais, numatoma jų trukme ir terminais. Sukursiu kelis skirtingus studento scenarijus su skirtingu laisvo laiko kiekiu ir užduočių apkrova bei patikrinsiu, ar sistema kiekvienu atveju sudaro skirtingą ir taisykles atitinkantį planą. Jei taisyklėmis pagrįstas sprendimas pasirodys nepakankamas, vėlesniame etape bus svarstomas AI panaudojimas papildomam personalizavimui. |
| Gali atsirasti konfliktų, kai kelioms užduotims iki termino lieka mažai laiko.              | Sukursiu testinius scenarijus su keliomis užduotimis ir ribotu laisvu laiku, kad būtų patikrinta, ar sistema teisingai identifikuoja neįmanomus atvejus.                                                                                                                                                                                                                                                                                                                                                       |
