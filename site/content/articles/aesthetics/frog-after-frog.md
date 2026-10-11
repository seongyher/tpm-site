---
title: "Frog After Frog: Prompt Engineering With Alternate Translations"
description: "I report the results of a prompt engineering experiment on DALL-E 2 involving different Japanese-to-English translations of the Frog Haiku by Matsuo Bashō (松尾 芭蕉, 1644 – November 28, 1694)."
date: 2023-09-21
author: "Seong-Young Her"
image: "../../../assets/articles/frog-after-frog/frog-019.webp"
tags:
  - artificial intelligence
  - art
  - prompt engineering
  - translation
  - haiku
---

*Originally published in *Artificial Intelligence Art*, 2023. https://doi.org/10.21428/f13786d0.a8196ff9 

## I. Introduction

In this article, I report the results of a prompt engineering experiment
on DALL-E 2, conducted between August and November of 2022. I
hypothesised that prompts containing different translations of the same
sentence will yield results from DALL-E that vary in some useful way for
artists, and tested this hypothesis by generating artworks using
different translations of the same sentence. To do this, I engineered a
minimal prompt template and combined it with various Japanese-to-English
translations of the Frog Haiku by Matsuo Bashō (松尾 芭蕉, 1644 –
November 28, 1694).

### Synopsis

In Part II, I explain my hypothesis.

In Part III, I justify the use of the Frog Haiku for the experiment.

In Part IV, I engineer the prompt.

In Part V, I present the AI artworks generated using the prompt
template.

In Part VI, I draw a brief conclusion.

## II. Hypothesis

DALL-E, a transformer language model developed by OpenAI, can generate
images based on natural language descriptions[\[1\]](#reference-1). OpenAI
provides a service which allows users to generate images including
artworks through *prompts*[\[2\]](#reference-2). Prompts are queries presented
in similar form to tasks which were solved by a language model during
its original training. They are typically in the form of a sentence with
blanks for the model to fill in (in the case of natural language
models), or a detailed description of an image (in the case of
text-to-image models). Prompt engineering refers to the activity of
constructing more effective prompts[\[3\]](#reference-3), and is a key skill
for creating AI art.

At an abstract, simplified level, image generation of the sort performed
by transformer language models like DALL-E involves: an *encoder*, which
extracts meaningful features from the input (text); a *decoder*, which
subsequently reassembles the extracted features into the output (image);
and the *latent space* between the decoder and the
encoder[\[4\]](#reference-4), which compress the input by extracting and
organising semantically important patterns from it into *symbolic*
representations of these patterns, so that the decoder can reconstruct
particular features using those symbols[\[5\]](#reference-5).

As such, creating AI art using transformers resembles translation, not
only in terms of human interface technology, but as an intrinsic,
architectural characteristic of the models themselves. It may not be too
far fetched to say that prompt engineering is the art of
human-to-machine translation. Taking the notion that "all art is
translation" [\[6\]](#reference-6) seriously, I abductively reasoned that all
translation is art also. Applying a similar line of thinking as
researchers who attempted to reverse engineer DALL-E's "secret language"
by recursively using the nonsensical textual output displayed in its
image output as prompts[\[7\]](#reference-7), I hypothesised that
conceptualising prompt engineering as a form of translation will be
useful for the purpose of creating AI art.

More formally, my hypothesis was that: prompts containing different
translations of the same sentence will yield results from DALL-E that
vary in some useful way for artists. The experiment I devised to test my
hypothesis was to create AI artworks with DALL-E using prompts
engineered using different translations of the same sentence, and
examining what kind of output was generated depending on the translation
used.

## III. Selecting the Sentence

Translation is a much more complex activity than readjusting the wording
of a sentence. It involves numerous considerations ranging from
aesthetics to cross-cultural communication, and one translation can
sometimes vary considerably from another. Thus, I needed to obtain a
corpus of translations of the same sentence which met these criteria:

-   Many alternate, English, translations exist of the same sentence;

-   The translators provided due care to each of the many translations;

-   There is substantial variation between the translations;

-   The sentence is short and clear, yet descriptive of an image or a
    scene;

-   The meaning of the sentence is unambiguous in the original text;

-   The integral meaning of the sentence is not intertextual, such as by
    relying on references to other works.

Together, the requirements above seem paradoxical. For instance, what
need (or possibility) is there for alternate translations, unless the
meaning of the sentence was ambiguous, leading to disagreement among
translators? One example may be that enough time had passed between
translations that the recipient language had changed substantially, such
as in the case with ancient texts like Plato's *Republic* or the Holy
Bible. But linguistic differences owing primarily to differences in the
translator's language of the time might skew the results in the
direction of expressing those temporal differences. Furthermore, the
*Republic* is a rich work that forms a complexly integrated whole, of
which no particular segment can be understood entirely without the rest;
the Bible is a definitively intertextual work, being a collection of
several scriptures from multiple cultures and religions.

While an AI-assisted exegesis of the Bible or of Plato was an extremely
interesting prospect, it was not what I wanted to examine. I needed to
test various translations, from at least the same era, of a short,
clear, descriptive, and unambiguous sentence, which was nonetheless
deemed interesting enough of a translational puzzle for many translators
to give it an earnest and original attempt. Yet, if not for the
ambiguity resulting from intertextual or extratextual factors, or
long-term linguistic drift, what need do texts have for such numerous
alternate translations? Was there such a sentence that could satisfy
these paradoxical requirements?

Basho's Frog Haiku turned out to be the perfect candidate.

### Basho's Frog Haiku

> 古池や\
> 蛙飛び込む\
> 水の音

—Matsuo Bashō (松尾 芭蕉, 1644 – November 28, 1694)

> The old mere!\
> A frog jumping in\
> The sound of water

—Matsuo Bashō (transl. Masaoka Shiki)[\[8\]](#reference-8)

There is little doubt that Bashō's Frog Haiku is the most famous haiku
of all time. It is almost certainly the most translated haiku as well:
hundreds of formal translations exist[\[9\]](#reference-9), and the act of
translating it has become something of a metapoetic rite of passage
amongst multilingual *haijin*. The precise details of its inception are
debated, but its composition is fairly well documented. The earliest
estimated date of its composition is set at 1681, *Tenna* 1; the most
popular theory sets it at 1686, *Jōkyō* 3[\[9\]](#reference-9). It was put
together at the Bashō-an (a hut in which Bashō resided at the time) in
Fukagawa, Tokyo, during the *Kawazu No Ku-Awase* ("Frog Verse
Competition") in the spring of 1686[\[10\]](#reference-10). It was subsequently
published in two anthologies in the same year: the *Iori-Zakura*
anthology (edited by Saigin, published in March 1686); and the *Haru no
Hi* anthology (edited by Kakei, published in August 1686)[\[9\]](#reference-9).
Three versions of the poem exist (emphasis denotes alteration from the
previous version):

| Version | Japanese | Romaji | Translation |
| --- | --- | --- | --- |
| 1 (Kikaku) | **山吹や**蛙飛んだる水の音 | ***yamabuki ya***/*kawazu tondaru*/*mizu no oto* | **Mountain rose**<br>A frog flies in<br>The sound of water |
| 2 (Saigin) | **古池や**蛙飛んだる水の音 | ***furuike ya***/*kawazu tondaru*/*mizu no oto* | **An old pond**<br>A frog flies in<br>The sound of water |
| 3 (Kakei) | 古池や蛙飛**び込む**水の音 | *furuike ya*/*kawazu to**bikomu***/*mizu no oto* | An old pond<br>A frog **jumps** in<br>The sound of water |

These three versions are the consequence of how the poem was drafted. At
the *Awase*, Bashō presented the second and third lines of the Frog
Haiku as they appear in versions 1 and 2, without the first line:

> 蛙飛んだる\
> 水の音
>
> kawazu tondaru\
> mizu no oto
>
> A frog flies in\
> The sound of water

The first line of a haiku, referred to as *kamigo* (上五, lit. the "top
five" *moji* of the poem) sets the scene, and is traditionally
considered important[\[9\]](#reference-9). Coming up with an appropriate
*kamigo* upon being prompted with the rest, a task referred to as
"capping" the poem, requires both wit and knowledge, for there are
numerous rules and intertextual implications to consider.

Takarai Kikaku (宝井其角, 1661–1707), one of Basho's most accomplished
disciples, attempted to cap the master's poem with the following
*kamigo*:

> 山吹や
>
> *yamabuki ya*
>
> Mountain rose

The *yamabuki* or the kerria flower had been, since the Heian period
(794-1185), associated with the imagery of croaking frogs (due to some
older classics pairing them together). By pairing it with the imagery of
a jumping frog instead, Kikaku was offering an aggressive criticism of
the established poetic order which considered the imagery of a frog
*jumping* (as opposed to singing or croaking) to be
vulgar[\[11\]](#reference-11).

However, Basho suggested his famous alternative:

> 古池や
>
> *furuike ya*
>
> An old pond

This resulted in "古池や蛙飛んだる水の音" (*furuike ya*/*kawazu
tondaru*/*mizu no oto*), at which the poets gathered at the competition
were truly impressed. It was not only a departure from the poetic norms
at large, but also a critique of the obvious criticism of convention
which had itself become conventional[\[10\]](#reference-10). By refusing to
recognise orthodoxy, even as the baseline point of reference for ironic
gestures (as was the case with Kikaku's critical haiku), Basho was able
to create a new and independent cultural context for his haiku.

As evident from the difference between the Saigin version and the Kakei
version shown above, Basho made an additional alteration to his poem
thereafter. His initial choice of words in describing the frog's jumping
as *tondaru* (飛んだる) was a colloquial phrasing. This was
characteristic of *haikai*, which made liberal use of vernacular
Japanese [\[12\]](#reference-12)[\[11\]](#reference-11). Nonetheless, it does not appear
in the final version printed in the Kakei anthology. Basho instead
settled on "古池や蛙飛び込む水の音" (*furuike ya*/*kawazu
tobikomu*/*mizu no oto*), a more formal choice of words. In doing so,
Basho ensured that the innovative force of the poem rests neither on its
critique of classical, *waka*, poetry; nor its fluent employment of
contemporary, *haikai*, conventions. At this point, the poem can be said
to have finally achieved independence from both the past and the
present, thereby becoming the first of its kind. Hence, as Shiki points
out, \"there is not the smallest thing to add beyond saying that it is
about the sound the speaker heard when a frog jumped into the water of
an old pond.\"[\[13\]](#reference-13) It is in this way that Basho's Frog Haiku
satisfies the paradoxical requirements of unambiguous, self-contained
meaning and translational interest, as well as being short, clear, and
descriptive.

## IV. Prompt Engineering

In order to engineer the best prompt for comparing different
translations of the Frog Haiku, I tested various combinations of the
poem and prompt elements. My goal was to produce a template prompt which
reliably produces aesthetically pleasing output without relying on
detailed, specific, descriptors outside of the Frog Haiku; I wanted the
effect of the particular translation to be apparent in the output.
Furthermore, I wanted the output to match the mood and aesthetic of the
poem. I thus decided to aim towards producing Japanese woodblock prints
in the style of master printmakers.

In traditional haiku competitions, two poems are presented side-by-side
to be judged together. Similarly, I present two samples per generation
below.

First, I tried Masaoka Shiki's English translation on its own:

> The old mere! A frog jumping in The sound of water

![DALL-E 2 prompt experiment 1, sample 1: The old mere translation.](../../../assets/articles/frog-after-frog/prompt-01.webp)

![DALL-E 2 prompt experiment 1, sample 2: The old mere translation.](../../../assets/articles/frog-after-frog/prompt-02.webp)

The results were photorealistic images of frogs in bog water, in rather
muted colour, accompanied by rather dirty looking plants. Perhaps the
word "mere" introduced a bias towards a specific scene, since the term
has some connotations of standing or shallow water.

However, substituting the word "mere" with "pond" did not improve the
results in this aspect:

> The old pond! A frog jumping in The sound of water

![DALL-E 2 prompt experiment 2, sample 1: The old pond substitution.](../../../assets/articles/frog-after-frog/prompt-03.webp)

![DALL-E 2 prompt experiment 2, sample 2: The old pond substitution.](../../../assets/articles/frog-after-frog/prompt-04.webp)

Here is the *naïve prompt*; Basho's original poem in Japanese, as it
appears in the Kakei anthology:

> 古池や蛙飛び込む水の音

![DALL-E 2 prompt experiment 3, sample 1: The original Japanese poem.](../../../assets/articles/frog-after-frog/prompt-05.webp)

![DALL-E 2 prompt experiment 3, sample 2: The original Japanese poem.](../../../assets/articles/frog-after-frog/prompt-06.webp)

Interestingly, the Japanese prompt consistently returned more vibrant
and intimate photos of frogs in a garden pond setting. This probably
reflects the cultural biases of photographers whose data contributed to
these generated images: frogs have had a more consistent run as a
beloved animal with positive connotations in the Sinosphere compared to
the West. Additionally, the particular species of frogs which inhabit
different regions of the world no doubt have a direct impact on whether
bogs or gardens are associated with frogs in the respective language of
each region. This may be a worthwhile lead to pursue in AI-assisted
folkbiology research.

Adding a space between each line of the poem seemed to further
accentuate this effect:

> 古池や 蛙飛び込む 水の音

![DALL-E 2 prompt experiment 4, sample 1: The Japanese poem with spaces.](../../../assets/articles/frog-after-frog/prompt-07.webp)

![DALL-E 2 prompt experiment 4, sample 2: The Japanese poem with spaces.](../../../assets/articles/frog-after-frog/prompt-08.webp)

Since I wanted to experiment specifically with AI-generated art, I added
a medium:

> "The old mere! A frog jumping in The sound of water". Japanese
> woodblock print

![DALL-E 2 prompt experiment 5, sample 1: The Japanese woodblock print medium.](../../../assets/articles/frog-after-frog/prompt-09.webp)

![DALL-E 2 prompt experiment 5, sample 2: The Japanese woodblock print medium.](../../../assets/articles/frog-after-frog/prompt-10.webp)

The results were quite promising for such a simple and straightforward
prompt. Incidentally, omitting "Japanese" from the prompt results in
significant stylistic differences:

> "The old mere! A frog jumping in The sound of water" Woodblock print

![DALL-E 2 prompt experiment 6, sample 1: The woodblock print medium without Japanese.](../../../assets/articles/frog-after-frog/prompt-11.webp)

![DALL-E 2 prompt experiment 6, sample 2: The woodblock print medium without Japanese.](../../../assets/articles/frog-after-frog/prompt-12.webp)

The output consistently featured single-colour prints that appear to be
on paper, and more than one frog seemed to be praying rather than
jumping.

Adding the medium (woodblock print; 木版画) to the naïve prompt:

> 古池や蛙飛び込む水の音。木版画。

![DALL-E 2 prompt experiment 7, sample 1: The Japanese woodblock print prompt.](../../../assets/articles/frog-after-frog/prompt-13.webp)

![DALL-E 2 prompt experiment 7, sample 2: The Japanese woodblock print prompt.](../../../assets/articles/frog-after-frog/prompt-14.webp)

While thematically consistent with the concept of medieval Japanese art
about frogs, the output resembled painted screens (屏風; *byōbu*) and
hanging scrolls (掛軸; *kakejiku*) rather than woodblock prints.
Specifying the medium as "日本の木版画" (Japanese woodblock printing)
and appending a style, "浮世絵" (*ukiyo-e*), did not resolve the issue:

> 古池や蛙飛び込む水の音。日本の木版画。浮世絵。

![DALL-E 2 prompt experiment 8, sample 1: The Japanese ukiyo-e prompt.](../../../assets/articles/frog-after-frog/prompt-15.webp)

![DALL-E 2 prompt experiment 8, sample 2: The Japanese ukiyo-e prompt.](../../../assets/articles/frog-after-frog/prompt-16.webp)

The output continued to display painted, rather than printed, imagery.
On the one hand, this is understandable given that *ukiyo-e* was
initially a style of painting which was only transferred to printing in
its transition into mass production. On the other hand, it is unclear
what was behind the model's preference for one medium over the other,
given that the medium was clearly specified. Additionally, I find the
aesthetic tone and the liberal use of empty space delightful.

I appended names of some famous master printmakers to the earlier
English language prompt specifying "Japanese woodblock print":

> "The old mere! A frog jumping in The sound of water" Japanese
> woodblock print, style of Kitagawa Utamaro, style of Katsushika
> Hokusai, style of Utagawa Hiroshige, style of Tsukioka Yoshitoshi,
> style of Hashiguchi Goyo

![DALL-E 2 prompt experiment 9, sample 1: The named printmakers in English.](../../../assets/articles/frog-after-frog/prompt-17.webp)

![DALL-E 2 prompt experiment 9, sample 2: The named printmakers in English.](../../../assets/articles/frog-after-frog/prompt-18.webp)

A marked improvement in mood and style emerged. The frogs produced using
this prompt were more dynamic, whimsical, and lively. Indeed, while not
precisely resembling the style of Japanese woodblock prints I was
initially looking for, it was aesthetically satisfying.

Next, I added a minor adjustment, adding "木版画" (woodblock print) to
the same prompt:

> "The old mere! A frog jumping in The sound of water" Japanese
> woodblock print (木版画), style of Kitagawa Utamaro, style of
> Katsushika Hokusai, style of Utagawa Hiroshige, style of Tsukioka
> Yoshitoshi, style of Hashiguchi Goyo

![DALL-E 2 prompt experiment 10, sample 1: The printmakers with the medium in kanji.](../../../assets/articles/frog-after-frog/prompt-19.webp)

![DALL-E 2 prompt experiment 10, sample 2: The printmakers with the medium in kanji.](../../../assets/articles/frog-after-frog/prompt-20.webp)

This resulted in a sudden shift in tone towards the salacious, with
output frequently featuring imagery of anthropomorphic frogs in kimono.
This is most likely due to the fact that some master printmakers were
famous for their *bijin-ga* (美人画) and *shunga* (春画). *Bijin-ga*
were prints of beautiful women, often produced to be sold as souvenirs
to fans of celebrity courtesans and theatre actors; *shunga* were erotic
artworks featuring scenes of various sexual acts. In spite of
printmaking guilds proscribing the practice, woodblock printing
technology greatly contributed to the increase in both quality and
quantity of erotic art over the centuries. The practice continued to
flourish until the advent of pornographic photography and the Meiji era
censorship of "premodern" culture finally displaced it[\[14\]](#reference-14).
Given that Western museums and galleries have historically been
reluctant to highlight the existence of *shunga* and exhibit them, it's
little wonder that "Japanese woodprint" (even juxtaposed with the names
of specific printmakers) lacks any of the erotic connotations of
"木版画".

Adding the names of each artist in both English and *kanji* seemed to
have unpredictable effects on the output:

> \"The old mere! A frog jumping in The sound of water\" —Matsuo Bashō
> 松尾 芭蕉. Japanese woodblock print 木版画. in the style of Kitagawa
> Utamaro 喜多川 歌麿, style of Katsushika Hokusai 葛飾 北斎, style of
> Utagawa Hiroshige 歌川 広重, style of Tsukioka Yoshitoshi 月岡 芳年,
> style of Hashiguchi Goyo 橋口 五葉

![DALL-E 2 prompt experiment 11, sample 1: The printmakers named in English and kanji.](../../../assets/articles/frog-after-frog/prompt-21.webp)

![DALL-E 2 prompt experiment 11, sample 2: The printmakers named in English and kanji.](../../../assets/articles/frog-after-frog/prompt-22.webp)

Adding the names of the various master printers in both English and
Japanese seemed to reduce the quality of the output. Perhaps it was
because the task of reconciling the distinctive styles of the masters is
a contradictory task, and stifling the bold and extreme stylistic
tendencies of each artist by diluting them with those of another's (even
if they are all masters) worsens the net result. It could also be that
the contexts in which the names of the artists appear in both English
and Japanese tend not to curate the exemplars based on aesthetics, but
instead educational accuracy, such as historical facts. Or perhaps the
contexts which omitted the *kanji* were more likely to feature
collections already filtered through the aesthetic preferences of a
Western eye, rather than aiming at a comprehensive collection watered
down by the artists' earlier or lesser works.

The fact that woodblock prints were a mass-produced medium, which were
created and sold by studios that typically specialised in the styles of
the master artists, probably contributes to the varied impact of each
artist's name as well. For instance, students inherited both the
leadership of a studio as well as the master's name, meaning that power
and prestige attached to a printmaker's name strongly correlated with
the number of prints attributed to it, which in turn corresponded with
the commercial success of the studio. Furthermore, the production of a
woodblock print was difficult to begin but profitable to continue once
begun. The production of woodblock prints within a studio system was an
involved process. It required the "*ukiyo-e* quintet" of the artist,
block copyist, carver, printer, and publisher[\[15\]](#reference-15)
collaborating (upon attaining approval from government censors first) to
develop designs, which could then be reproduced by any publisher holding
the woodblocks. Although the first legislation on copyright was not
introduced in Japan until 1869[\[16\]](#reference-16), this meant that publishers
(who owned the blocks) owned the copyright to prints for all intents and
purposes; a right which they exploited to the fullest by creating
reprints until the blocks wore and faded (as well as having carvers
create copies of the original blocks)[\[17\]](#reference-17). This led to the
gradual decline in quality of reproduced prints.

The studio system which gave rise to these problems was critiqued as
uncreative and somehow less than real art, by a modern woodblock
printing movement called *sōsaku-hanga* (創作版画, creative prints). The
*sōsaku-hanga* movement's credo was "*jiga, jikoku*, *jizuri*" (自画 •
自刻 • 自摺; self-drawn, self-carved, self-printed), and it rejected
studio-based woodblock printing as *fukusei hanga* (複製版画), or copy
prints [\[18\]](#reference-18). Between the art forgery aimed at swindling
Western buyers, the profit motive of the printers (whose audience
consisted of less affluent laypeople in the first place), and the
students with radically different styles, the masters' names would have
been diluted several times over. Nonetheless, I decided to test
specifying a particular school for the style of the output:

> "The old mere! A frog jumping in The sound of water". Japanese
> woodblock print, in the style of Utagawa School

![DALL-E 2 prompt experiment 12, sample 1: The Utagawa School prompt.](../../../assets/articles/frog-after-frog/prompt-23.webp)

![DALL-E 2 prompt experiment 12, sample 2: The Utagawa School prompt.](../../../assets/articles/frog-after-frog/prompt-24.webp)

The output was charming, but decidedly off the mark. In particular, some
of the output was closer to clip art than traditional art. The word
"School" may have been interpreted to mean that the artworks are
intended for schoolchildren. The garish overuse of bright and
ill-matched colour palettes give the impression that they were produced
by inexperienced printmakers lacking in restraint. Such overindulgence
in new pigments was a common response to the discovery of new
colourants[\[19\]](#reference-19). Yet, similar impulses attained heights of
virtuosity in the hands of masters such as Hokusai and his Prussian
Blue.

Another prompt, including the *kanji* for some words this time:

> "The old mere! A frog jumping in The sound of water". Japanese
> woodblock print (木版画), in the style of Utagawa (歌川) School

![DALL-E 2 prompt experiment 13, sample 1: The Utagawa School prompt with kanji.](../../../assets/articles/frog-after-frog/prompt-25.webp)

![DALL-E 2 prompt experiment 13, sample 2: The Utagawa School prompt with kanji.](../../../assets/articles/frog-after-frog/prompt-26.webp)

The output shifted closer to the desired result. However, the impact of
the *bijin-ga* and *shunga* within the dataset was apparent in the
rather human splaying of the legs and the composition resembling a
bedroom more than a pond. Several of the Utagawa school's masters,
including the founder Utagawa Toyoharu (歌川 豊春, c. 1735 – 1814),
produced numerous works featuring *bijin* and theatre actors. Their
influence was showing through in the output.

Here, I replaced the Utagawa School in the prompt with the Hokusai
School:

> "The old mere! A frog jumping in The sound of water". Japanese
> woodblock print (木版画), in the style of Hokusai (北斎) School

![DALL-E 2 prompt experiment 14, sample 1: The Hokusai School prompt with kanji.](../../../assets/articles/frog-after-frog/prompt-27.webp)

![DALL-E 2 prompt experiment 14, sample 2: The Hokusai School prompt with kanji.](../../../assets/articles/frog-after-frog/prompt-28.webp)

Specifying Hokusai instead of Utagawa resolved the problem of erotic
frog art. The monochromatic images show the influence of the *aizuri-e*
(藍摺絵, blue printed pictures) which Hokusai produced using Prussian
Blue, a pigment introduced during the 1820s. Hokusai enthusiastically
participated in the "blue revolution" [\[20\]](#reference-20) brought on by the
introduction of the pigment. His *Thirty-Six Views of Mount Fuji* (begun
between 1830 and 1832) are his masterworks in the genre. The famous
*Great Wave off Kanagawa* is among them.

However, the images demonstrate fading and a dullness of hue,
limitations specific to the preexisting natural blue pigments (indigo
and dayflower blue) to which Prussian Blue presented a superior
alternative [\[21\]](#reference-21). This suggests that DALL-E has a limited and
stereotyped understanding of Hokusai's work. I did not want to limit my
experiment to monochrome prints if they were also poor representations
of the subgenre. Given that specifying the names of multiple artists in
English only had yielded the best results thus far (in balancing
accuracy and aesthetic variety), and that including the original
Japanese poem seemed effective, as did specifying the medium in both
English and kanji, I formulated this prompt:

> "The old mere! A frog jumping in The sound of water".
> (古池や蛙飛び込む水の音). Japanese woodblock print (木版画), style of
> Kitagawa Utamaro, style of Katsushika Hokusai, style of Utagawa
> Hiroshige, style of Tsukioka Yoshitoshi, style of Hashiguchi Goyo

![DALL-E 2 prompt experiment 15, sample 1: The combined English and Japanese poem.](../../../assets/articles/frog-after-frog/prompt-29.webp)

![DALL-E 2 prompt experiment 15, sample 2: The combined English and Japanese poem.](../../../assets/articles/frog-after-frog/prompt-30.webp)

While the output routinely deviated from woodblock prints towards
paintings, I found them to be beautiful. I decided to test out one more
minor detail before "freezing" the prompt template and moving onto
testing the alternate translations; I replaced the parentheses around
Basho's original poem with *kagikakko* (鉤括弧; hook brackets), and
added a Japanese full stop (句点; *kuten*):

> "The old mere! A frog jumping in The sound of water".
> 「古池や蛙飛び込む水の音」。Japanese woodblock print (木版画), style
> of Kitagawa Utamaro, style of Katsushika Hokusai, style of Utagawa
> Hiroshige, style of Tsukioka Yoshitoshi, style of Hashiguchi Goyo

![DALL-E 2 prompt experiment 16, sample 1: The prompt with Japanese punctuation.](../../../assets/articles/frog-after-frog/prompt-31.webp)

![DALL-E 2 prompt experiment 16, sample 2: The prompt with Japanese punctuation.](../../../assets/articles/frog-after-frog/prompt-32.webp)

The result was a substantive reduction in quality and accuracy of the
output. Furthermore, the output seemed to feature coloured pencil
drawings and watercolour paintings hanging on walls and pin boards. The
likely reason is not far to seek: reading, writing, and creating art
based on haiku is a well-established tradition in Japan for not only
adults but children as well. In the West, children's haiku only gained
popularity in the 60s and 70s[\[22\]](#reference-22), although it is also
well-established by now. The result is that the Japanese punctuation
marks resulted in output based on Japanese children's art about Basho's
Frog Haiku. It was a copy of a copy: the master woodblock printers who
had learned their masters' style, whose students and hired workers
followed to mass produce prints, which were passed down and copied by
Japanese school children, whose works were ingested and compressed by
the machine learning model, and probabilistically reassembled into an
image based on the contents of the textual prompt. At the time of my
writing, opinion on the impact of punctuation varies amongst AI artists.
In this case, it had demonstrated a striking effect.

I decided that I had enough information about the formulation of the
prompts to commit to freezing the prompt template:

> "{translation}" (古池や蛙飛び込む水の音). Japanese woodblock print
> (木版画), style of Kitagawa Utamaro, style of Katsushika Hokusai,
> style of Utagawa Hiroshige, style of Tsukioka Yoshitoshi, style of
> Hashiguchi Goyo

## V. One Hundred Frogs

Below are selected AI artworks which I generated with DALL-E using the
combination of each translation and the prompt template.

For the translations, I relied on the collection presented by Sato in
his landmark anthology, *One Hundred Frogs*. I generated the output
several times in some cases, but only selected one image per prompt to
present in this article.

My selection criterion was whether the artwork moved me aesthetically
when viewed alongside the translation used in its prompt, or was
interesting in some other way. I present them with various art critical
commentary, as well as my own interpretations, which are neither factual
nor scientific but instead represent a case study involving one artist.

### Frog 1 (transl. Masaoka Shiki)

The old mere!\
A frog jumping in\
The sound of water

![DALL-E 2 artwork for Frog 1, using the translation by Masaoka Shiki. A frog leaps into the image from the left; a gentle and polite little animal, its eyes are relaxed and curious.](../../../assets/articles/frog-after-frog/frog-001.webp)

A frog leaps into the image from the left; a gentle and polite little
animal, its eyes are relaxed and curious. It tilts its head ever so
slightly as it marvels at the dreamlike scene. The water is dotted with
light tonight. Perhaps they are paper lanterns lit by festivalgoers,
guiding the deceased to the afterlife. A pine tree stretches inward, as
though to shield the precious moment from wind and rain.

### Frog 2 (transl. Lafcadio Hearn)

Old pond—frogs jumped in—sound of water.

![DALL-E 2 artwork for Frog 2, using the translation by Lafcadio Hearn. A translation of the poem featuring more than one frog is a rarity.](../../../assets/articles/frog-after-frog/frog-002.webp)

A translation of the poem featuring more than one frog is a rarity.
There is much debate surrounding the precise scene depicted. While
historical circumstances place Basho at his second hut (gifted to him by
a fisherman disciple, replacing the first one which burned down),
suggesting that the frogs were indeed present at the faithful moment of
the poem's completion, there is little reason to suspect that the poem
was conceived of whilst he listened to the frogs, which usually appear
in groups.

### Frog 3 (transl. W. G. Aston)

*An ancient pond!*\
*With a sound from the water*\
*Of the frog as it plunges in.*

![DALL-E 2 artwork for Frog 3, using the translation by W. G. Aston. The word "ancient" seems to be an important keyword for DALL-E.](../../../assets/articles/frog-after-frog/frog-003.webp)

The word "ancient" seems to be an important keyword for DALL-E. Its
inclusion caused human figures to appear much more often, and these
figures frequently blended together with the frog in the image into one
entity. They appear to be from an earlier era than the printmakers cited
in the prompt, by several centuries. Here, a man or a woman dressed as a
frog is intently focused on writing something with a calligraphy brush
(a haiku, no doubt).

### Frog 4 (transl. Basil Hall Chamberlain)

The old pond, aye! and the sound of a frog leaping into the

&nbsp;&nbsp;&nbsp;&nbsp;water.


![DALL-E 2 artwork for Frog 4, using the translation by Basil Hall Chamberlain. The juxtaposition of the little frog and the plants in various stages of wilting and blooming is reminiscent of Ohara Koson, famous for his observant prints of plants and gentle animals, often rendered against a minimal or blank background.](../../../assets/articles/frog-after-frog/frog-004.webp)

The juxtaposition of the little frog and the plants in various stages of
wilting and blooming is reminiscent of Ohara Koson, famous for his
observant prints of plants and gentle animals, often rendered against a
minimal or blank background. But the busy framing of the scene takes
away from the tenderness of the subject matter, as though the image is
uncertain about where one ought to focus.

### Frog 5 (transl. Clara A. Walsh)

An old-time pond, from off whose shadowed depth\
Is heard the splash where some lithe frog leaps in.

![DALL-E 2 artwork for Frog 5, using the translation by Clara A. Walsh. The translation returned rather wobbly and underdefined shapes.](../../../assets/articles/frog-after-frog/frog-005.webp)

The translation returned rather wobbly and underdefined shapes. Here is
a frog which appears more like a *yokai* than a typical amphibian. He
seems to feel a little out of place as he looks around with that big eye
of his. The playful lines of the lotus leaves evoke the echoing sound of
water.

### Frog 6 (transl. William J. Porter)

&nbsp;&nbsp;&nbsp;&nbsp;Into the calm old lake\
A frog with flying leap goes plop !\
&nbsp;&nbsp;&nbsp;&nbsp;The peaceful hush to break.


![DALL-E 2 artwork for Frog 6, using the translation by William J. Porter. The frog leaps into the pitch-black night sky, becoming a part of it but for a moment, as the lotus flower beneath is a part of the pond.](../../../assets/articles/frog-after-frog/frog-006.webp)

The frog leaps into the pitch-black night sky, becoming a part of it but
for a moment, as the lotus flower beneath is a part of the pond.

### Frog 7 (transl. Gertrude Emerson)

Old pond, aye! and the sound of a frog jumping in.

![DALL-E 2 artwork for Frog 7, using the translation by Gertrude Emerson. A frog lays flat atop a mossy boulder, as a boat floats by in the background.](../../../assets/articles/frog-after-frog/frog-007.webp)

A frog lays flat atop a mossy boulder, as a boat floats by in the
background. A blue tapestry stands against a tree to the left. The
scene, with its flat perspective and a conspicuous lack of colour and
detail, leaves much to the imagination. It looks as though the boat has
capsized and its contents have spilled out, floating helplessly
alongside the waterlogged boat. Perhaps the frog is a samurai who has
narrowly survived drowning, and the tapestry is the heraldry of its
clan.

### Frog 8 (transl. Yone Noguchi)

The old pond\
A frog leapt into—\
List, the water sound!

![DALL-E 2 artwork for Frog 8, using the translation by Yone Noguchi. Two children observe an enormous frog.](../../../assets/articles/frog-after-frog/frog-008.webp)

Two children observe an enormous frog. The older child carefully pushes
aside the overgrown grass as his younger sibling peeps out from behind a
rock. The details of the printing and the censor's seal are visible to
the left of the image, but are not legible. Perhaps it depicts an old
fairytale about an ancient frog which could transform into a human
being, so old and powerful was the frog. Would the frog have promised
the children a wish in exchange for keeping its existence a secret?

### Frog 9 (transl. Curtis Hidden Page)

A lonely pond in age-old stillness sleeps . . .\
&nbsp;&nbsp;&nbsp;&nbsp;Apart, unstirred by sound or motion . . . till\
Suddenly into it a lithe frog leaps.


![DALL-E 2 artwork for Frog 9, using the translation by Curtis Hidden Page. This translation seemed to activate a "nightmare vision" in the model, and consistently produced images resembling horror-film stills and black metal album covers.](../../../assets/articles/frog-after-frog/frog-009.webp)

This translation seemed to activate a "nightmare vision" in the model,
and consistently produced images resembling horror-film stills and black
metal album covers. Several were actually in the shape of album covers,
complete with the title and the artist's name. Between the distorted
photographs of water, a creature I call "Demon Frog" began showing up in
the output. This is unfortunate given that the translation itself is
beautiful.

### Frog 10 (transl. Inazo Nitobe)

Into an old pond\
A frog took a sudden plunge,\
Then is heard a splash.

![DALL-E 2 artwork for Frog 10, using the translation by Inazo Nitobe. The frog is concentrating hard as it rides the tiny wave on top of a surfboard made of an empty egg.](../../../assets/articles/frog-after-frog/frog-010.webp)

The frog is concentrating hard as it rides the tiny wave on top of a
surfboard made of an empty egg. It's causing quite a stir as it plunges
about in the old pond. I can imagine this printed on a hand-held fan to
be used in summer.

### Frog 11 (transl. John Thomas Bryan)

There is the old pond!\
&nbsp;&nbsp;&nbsp;&nbsp;Lo, into it jumps a frog :\
hark, water\'s music!


![DALL-E 2 artwork for Frog 11, using the translation by John Thomas Bryan. This frog is about to sail out on a dried leaf.](../../../assets/articles/frog-after-frog/frog-011.webp)

This frog is about to sail out on a dried leaf. I admire the determined
look on its face as it sets about, holding firmly onto the grab rails.
Judging by the title on the top right of the page, this is part six (六)
of its adventure: an experienced traveler.

### Frog 12 (transl. Asataro Miyamori)

The old pond!\
&nbsp;&nbsp;&nbsp;&nbsp;A frog has plunged—\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The splash!


![DALL-E 2 artwork for Frog 12, using the translation by Asataro Miyamori. Two frogs rise from a bed made of a flower, one still hugging a pillow of petal as the other stretches its legs.](../../../assets/articles/frog-after-frog/frog-012.webp)

Two frogs rise from a bed made of a flower, one still hugging a pillow
of petal as the other stretches its legs. The streaky and uneven
application of the colours and the awkward composition are made up for
by the emotionally observant depiction of the frogs engaged in
inconsequentially human acts.

### Frog 13 (transl. Asataro Miyamori)

Into the calm old pond \
A frog plunged—then the splash.

![DALL-E 2 artwork for Frog 13, using the translation by Asataro Miyamori. Yet another frog with its own surfboard, this time made of a dried lotus leaf.](../../../assets/articles/frog-after-frog/frog-013.webp)

Yet another frog with its own surfboard, this time made of a dried lotus
leaf. It seems rather proud of its fancy board as it paddles forward
with its head held up. It must be swimming over to join the earlier
surfing frog from Inazo Nitobe's translation.

### Frog 14 (transl. Asataro Miyamori)

#### The Old Pond

The ancient pond!\
A frog plunged—splash!

![DALL-E 2 artwork for Frog 14, using the translation by Asataro Miyamori. There are many folktales in East Asia involving kind-hearted people whose charity toward animals is repaid in gold and silver.](../../../assets/articles/frog-after-frog/frog-014.webp)

There are many folktales in East Asia involving kind-hearted people
whose charity toward animals is repaid in gold and silver. The animals
sometimes gift their saviour with a magical artefact which looks like an
ordinary household object but produces treasure when used. Here, this
child has been gifted rice hullers that give golden coins instead of
hulling rice. Perhaps she made a little pond for the frogs, saving them
from drying out in the hot summer sun.

### Frog 15 (transl. Asataro Miyamori)

The old pond! A frog plunged—\
The sound of the water!

![DALL-E 2 artwork for Frog 15, using the translation by Asataro Miyamori. A wistful frog looks up into the starry night sky.](../../../assets/articles/frog-after-frog/frog-015.webp)

A wistful frog looks up into the starry night sky. The sound of a frog
plunging into water nearby reminds it of home. Irises bloom modestly in
the background, in front of a hut atop a hill resembling a bento
lunchbox wrapped in patterned cloth. The frog recounts a story to cheer
itself up; about a magic tablecloth which can always take it back home
to see its friends and family, no matter how far it has ventured.

### Frog 16 (transl. Hidesaburo Saito)

Old garden lake!\
&nbsp;&nbsp;&nbsp;&nbsp;The frog thy depth doth seek,\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;And sleeping echoes wake.


![DALL-E 2 artwork for Frog 16, using the translation by Hidesaburo Saito. The hazy, faded print and the green outlines of this image make it look like an illustration accompanying a Western medieval fairytale, included as part of an anthology of abridged stories.](../../../assets/articles/frog-after-frog/frog-016.webp)

The hazy, faded print and the green outlines of this image make it look
like an illustration accompanying a Western medieval fairytale, included
as part of an anthology of abridged stories. This blind frog is wise, if
not magical, and I would treat it with respect if I encountered it.

### Frog 17 (transl. Minoru Toyoda)

An ancient pond!\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A frog leaps in;\
&nbsp;&nbsp;&nbsp;&nbsp;The sound of the water!


![DALL-E 2 artwork for Frog 17, using the translation by Minoru Toyoda. I adore the way this image is framed.](../../../assets/articles/frog-after-frog/frog-017.webp)

I adore the way this image is framed. The stillness of the lily pads;
the dynamism of the leaping frog; the soft shape of the pond into which
it is jumping; the stars scattered across the water's surface. Could
this be the frog's point of view, as it leaps into its own reflection in
the old pond?

### Frog 18 (transl. Harold G. Henderson)

An ancient pond;\
&nbsp;&nbsp;&nbsp;&nbsp;Plash of the water\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;When a frog jumps in.


![DALL-E 2 artwork for Frog 18, using the translation by Harold G. Henderson. One frog approaches another from behind in this sparse scene of a pond.](../../../assets/articles/frog-after-frog/frog-018.webp)

One frog approaches another from behind in this sparse scene of a pond.
The writing is illegible, save for the last character (木, tree). It was
common practice to include poems as part of woodblock prints. Perhaps
this one is about a tree.

### Frog 19 (transl. Fumiko Saisho)

*Fu-ru* (old) *i-ke* (pond) *ya*, *ka-wa-zu* (frog) *to-bi-ko-mu*
(jumping into) *mi-zu* (water) *no o-to* (sound)

![DALL-E 2 artwork for Frog 19, using the translation by Fumiko Saisho. This eccentric transliteration consistently produced delightful output.](../../../assets/articles/frog-after-frog/frog-019.webp)

This eccentric transliteration consistently produced delightful output.
This is my favourite little guy I generated. I call him "Frug" because
he is flat like a rug. He is an affluent frog who lives in a rich man's
warehouse, surrounded by all manner of luxuries including expensive
works of art and delicacies, with nary a care in the world!

### Frog 20 (transl. Inazo Nitobe)

An old pond—\
A frog jumps in—\
A splash of water.

![DALL-E 2 artwork for Frog 20, using the translation by Inazo Nitobe. This humble frog doesn't mind that its pond is so small.](../../../assets/articles/frog-after-frog/frog-020.webp)

This humble frog doesn't mind that its pond is so small. It jumps in
gratefully, and creates a tiny little splash in the process.

### Frog 21 (transl. Daisetz T. Suzuki)

Into the ancient pond\
A frog jumps\
Water\'s sound!

![DALL-E 2 artwork for Frog 21, using the translation by Daisetz T. Suzuki. The word "ancient" seems to be a reliable keyword for invoking classical styles.](../../../assets/articles/frog-after-frog/frog-021.webp)

The word "ancient" seems to be a reliable keyword for invoking classical
styles. In this case, this frog deity levitating above the world is
reminiscent of the Frog Buddha which appears in the
*Chōjū-jinbutsu-giga* (鳥獣人物戯画, lit. Animal-person Caricatures;
Animal Scrolls), produced in the late Heian Period.

### Frog 22 (transl. R. H. Blyth)

The old pond.\
&nbsp;&nbsp;&nbsp;&nbsp;A frog jumps in—\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Plop!


![DALL-E 2 artwork for Frog 22, using the translation by R. H. Blyth. A shy and timid frog watches a boisterous and daring frog plunge into the pond.](../../../assets/articles/frog-after-frog/frog-022.webp)

A shy and timid frog watches a boisterous and daring frog plunge into
the pond. It is hesitant but excited to join in, even though it is not
usually so outgoing. A friendship to cherish forever.

### Frog 23 (transl. Kenneth Yasuda)

Ancient pond unstirred\
Into which a frog has plunged,\
&nbsp;&nbsp;&nbsp;&nbsp;A splash was heard.


![DALL-E 2 artwork for Frog 23, using the translation by Kenneth Yasuda. The vibrant and expansive backdrop of bright gold, speckled throughout with geometric decorations, is reminiscent of Gustav Klimt during his "Golden Phase".](../../../assets/articles/frog-after-frog/frog-023.webp)

The vibrant and expansive backdrop of bright gold, speckled throughout
with geometric decorations, is reminiscent of Gustav Klimt during his
"Golden Phase". The art historical connection itself is not far to seek,
as Klimt was a famous Japanophile whose obsession with Japanese art
influenced his own work. However, the directionality of influence is
reversed here: a Japanese woodblock print, by a printmaker influenced by
Klimt.

### Frog 24 (transl. R. H. Blyth)

&nbsp;&nbsp;&nbsp;&nbsp;The old pond;\
A frog jumps in,—\
&nbsp;&nbsp;&nbsp;&nbsp;The sound of the water.


![DALL-E 2 artwork for Frog 24, using the translation by R. H. Blyth. A crumpled pile of kimono, beneath a cherry blossom tree, presented alongside a poem about a frog (a spring season word), make the erotic nature of the scene all too apparent.](../../../assets/articles/frog-after-frog/frog-024.webp)

A crumpled pile of kimono, beneath a cherry blossom tree, presented
alongside a poem about a frog (a spring season word), make the erotic
nature of the scene all too apparent.

### Frog 25 (transl. G. S. Fraser)

The old pond, yes!\
A frog jumping in.\
The water\'s noise!

![DALL-E 2 artwork for Frog 25, using the translation by G. S. Fraser. The childlike image shows a watermelon-patterned frog gazing out at the sea from atop a cliff, like a tiny and awkward Wanderer above the Sea of Fog.](../../../assets/articles/frog-after-frog/frog-025.webp)

The childlike image shows a watermelon-patterned frog gazing out at the
sea from atop a cliff, like a tiny and awkward Wanderer above the Sea of
Fog. It seems to depict the pond as the frog experiences it: a vast and
torrential ocean.

### Frog 26 (transl. G. S. Fraser)

The old pond, yes, and\
A frog-jumping-in-the-\
Water\'s noise!

![DALL-E 2 artwork for Frog 26, using the translation by G. S. Fraser.](../../../assets/articles/frog-after-frog/frog-026.webp)

G. S. Fraser's variants of this particular translation resulted in a
surprising variety of output. In this humorous and simplistic scene, a
humanoid frog (clearly a vassal to a frog king of some kind) visits a
regular frog to deliver a decree. It's probably been announced that all
frogs must wear proper clothing and use cutlery when eating flies, so as
to not embarrass the court by acting impolite.

### Frog 27 (transl. G. S. Fraser)

Old pond, yes, and\
Frog-jump-in-\
Water\'s noise!

![DALL-E 2 artwork for Frog 27, using the translation by G. S. Fraser. The lines of this print are sharp and crisp with little sign of wear and tear.](../../../assets/articles/frog-after-frog/frog-027.webp)

The lines of this print are sharp and crisp with little sign of wear and
tear. This suggests it is an earlier imprint created using a newly
carved block. The frog is smoking a pipe and contemplating a bridge
which leads west to a pagoda, in reference to India and Central Asia,
from which Buddhism spread into East Asia.

### Frog 28 (transl. G. S. Fraser)

Old pond, yes, and\
Frog jump in!\
Water\'s noise!

![DALL-E 2 artwork for Frog 28, using the translation by G. S. Fraser. The browned paper and the sharp outlines surrounding matte colours give this image a modern feel.](../../../assets/articles/frog-after-frog/frog-028.webp)

The browned paper and the sharp outlines surrounding matte colours give
this image a modern feel. An overflowing river and trees bending to the
wind take up the majority of the frame, yet the scene feels barren. It
isn't clear whether we could hear the frog over the wind and the water,
were it to jump into the water right now.

### Frog 29 (transl. Donald Keene)

The ancient pond\
A frog leaps in\
The sound of the water.

![DALL-E 2 artwork for Frog 29, using the translation by Donald Keene. Printmakers would sometimes incorporate accompanying text directly into the pictures, such as by using the letters to decorate parts of it, or by blending the strokes of the characters into objects.](../../../assets/articles/frog-after-frog/frog-029.webp)

Printmakers would sometimes incorporate accompanying text directly into
the pictures, such as by using the letters to decorate parts of it, or
by blending the strokes of the characters into objects. This influence
sometimes shows through in the output. However, this image looks more
like a map. It is reminiscent of the Carta Marina, famous for the
illustrations of sea monsters between its meticulously charted masses of
land.

### Frog 30 (transl. Donald Keene)

The ancient pond, a frog jumps in, the sound of the water.

![DALL-E 2 artwork for Frog 30, using the translation by Donald Keene. A roiling stream coarses through the image.](../../../assets/articles/frog-after-frog/frog-030.webp)

A roiling stream coarses through the image. The currents grow larger as
they approach the viewer and add depth to the scene. Four frogs swim
beneath the surface, their silhouettes playfully gliding about.

### Frog 31 (transl. Kenneth Rexroth)

An old pond—\
The sound\
Of a diving frog.

![DALL-E 2 artwork for Frog 31, using the translation by Kenneth Rexroth. This tiny frog resembles a fragile creature like an aphid or a jumping spider.](../../../assets/articles/frog-after-frog/frog-031.webp)

This tiny frog resembles a fragile creature like an aphid or a jumping
spider. It lifts itself and prepares to hop, its innocent eyes in awe at
the way the bamboo tree towers over the pond.

### Frog 32 (transl. Peter Beilenson)

OLD DARK SLEEPY POOL . . .\
&nbsp;&nbsp;&nbsp;&nbsp;QUICK UNEXPECTED\
&nbsp;&nbsp;&nbsp;&nbsp;FROG\
GOES PLOP! WATERSPLASH!


![DALL-E 2 artwork for Frog 32, using the translation by Peter Beilenson. A sleepy frog jolts awake as it falls backward into a pool of water.](../../../assets/articles/frog-after-frog/frog-032.webp)

A sleepy frog jolts awake as it falls backward into a pool of water. See
its stunned expression as it wiggles its arms and legs about, grasping
in vain at the branch it was sleeping on until a moment before. It's
adorable.

### Frog 33 (transl. Harold G. Henderson)

Old pond:\
&nbsp;&nbsp;&nbsp;&nbsp;frog jump-in\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;water-sound.


![DALL-E 2 artwork for Frog 33, using the translation by Harold G. Henderson. The colourful, grainy texture of this image comes not from woodblock prints but from scanners which were used to scan some of the prints.](../../../assets/articles/frog-after-frog/frog-033.webp)

The colourful, grainy texture of this image comes not from woodblock
prints but from scanners which were used to scan some of the prints.
While such artefacts are avoided by photographers and cleaned up in post
(not to mention being a common use case for AI-assisted photo
restoration), it adds a sentimental ambience to the artwork here.

### Frog 34 (transl. Harold G. Henderson)

Old-pond&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;frog&nbsp;&nbsp;&nbsp;&nbsp;jump-in&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;water-sound

![DALL-E 2 artwork for Frog 34, using the translation by Harold G. Henderson. According to one folktale, there lived two frogs: one was a cultured frog from Kyoto; and the other was a rich frog from Osaka.](../../../assets/articles/frog-after-frog/frog-034.webp)

According to one folktale, there lived two frogs: one was a cultured
frog from Kyoto; and the other was a rich frog from Osaka. They wished
to see the rest of the world, and each decided to travel to the other
city. They met atop a tall mountain halfway between. The frogs attempted
to help one another get a better look at their respective destination by
embracing, so that they could both stand tall on their hindlegs.
However, being silly frogs, they didn\'t realise that their eyes were
now pointing at the direction from which they hailed; disappointed that
Kyoto and Osaka were apparently identical, they both returned home and
never traveled again.

### Frog 35 (transl. Harold G. Henderson)

Old pond—\
&nbsp;&nbsp;&nbsp;&nbsp;and a frog-jump-in\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;water-sound


![DALL-E 2 artwork for Frog 35, using the translation by Harold G. Henderson. The snaking river and the mountain in the distance gives this image a sense of perspective.](../../../assets/articles/frog-after-frog/frog-035.webp)

The snaking river and the mountain in the distance gives this image a
sense of perspective. It appears to be a view of Mount Fuji with its
snow-capped tip in the distance. The focus on the frogs crossing the
river and the bamboo trees positioned in front of the sunset and the
mountain downplays the significance of the scenery. It's unclear whether
it pays off for the artwork as a whole; the rocks peeking out from the
river, however, suggest an appreciation for mundane details which might
have seemed artificial if expressed with the frogs alone.

### Frog 36 (transl. The Japan Society for the Promotion of Science)

The old pond!\
A frog jumps in—\
Sound of the water.

![DALL-E 2 artwork for Frog 36, using the translation by The Japan Society for the Promotion of Science. An orange sun sets between the trees like a ripe persimmon, with a frog watching lazily.](../../../assets/articles/frog-after-frog/frog-036.webp)

An orange sun sets between the trees like a ripe persimmon, with a frog
watching lazily. A tranquil sight.

### Frog 37 (transl. Hiroshi Takamine)

Oh, into the old pond\
&nbsp;&nbsp;&nbsp;&nbsp;A frog plunged,\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;With a splash!\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(And once again calm prevails!)


![DALL-E 2 artwork for Frog 37, using the translation by Hiroshi Takamine. This translation proved to be quite volatile, and produced unpredictable output with a lot of variety.](../../../assets/articles/frog-after-frog/frog-037.webp)

This translation proved to be quite volatile, and produced unpredictable
output with a lot of variety. Unlike one of the earlier translations
that kept producing anthropomorphic frogs in an art style of an earlier
period, this translation produced anthropomorphic frogs in a more modern
style.

### Frog 38 (transl. Anonymous)

Ancient pond;\
frog jumps in;\
sound of water.

![DALL-E 2 artwork for Frog 38, using the translation by Anonymous. A mousey little frog paddles toward a log in this plain looking monochrome print.](../../../assets/articles/frog-after-frog/frog-038.webp)

A mousey little frog paddles toward a log in this plain looking
monochrome print. Bamboo trees lean in, thin and soft, gently
encouraging the small animal.

### Frog 39 (transl. Cid Corman)

old pond\
frog leaping\
splash

![DALL-E 2 artwork for Frog 39, using the translation by Cid Corman. A tragic scene: a bird's egg falls to the ground, its contents splashing everywhere.](../../../assets/articles/frog-after-frog/frog-039.webp)

A tragic scene: a bird's egg falls to the ground, its contents splashing
everywhere. The frog leaps to its feet, but there is nothing it can do.

### Frog 40 (transl. Daisetz T. Suzuki)

The old pond, ah!\
A frog jumps in:\
The water\'s sound.

![DALL-E 2 artwork for Frog 40, using the translation by Daisetz T. Suzuki.](../../../assets/articles/frog-after-frog/frog-040.webp)

D. T. Suzuki was a major populariser of Zen in the West and a military
apologist for Imperial Japan. The translation was unreliable in
producing good output, but this one stood out to me. It is a
perspectival trick which frames the scene from above a hill, the moment
captured right as a frog jumps toward the cat from behind. A frog swims
up toward a night sky, full of not only stars but lily pads with other
frogs sitting on them as well. A cat watches from beneath in awe and
wonder. To connect the beautiful image and the translation with the
historical background of the translator here would be tactless. The frog
reminds me of Chagall's paintings of magical farm animals, many of whom
could fly effortlessly.

### Frog 41 (transl. Harold Stewart)

The old green pond is silent; here the hop\
Of a frog plumbs the evening stillness: plop!

![DALL-E 2 artwork for Frog 41, using the translation by Harold Stewart. The image is almost entirely made up of greens.](../../../assets/articles/frog-after-frog/frog-041.webp)

The image is almost entirely made up of greens. The frog and the flowers
bring the viewer\'s focus not by the use of many colours but by their
absence; their plainness stands out against the vibrant green. The use
of the same colours for the flowers and the frog seems to point out that
the frog is to the pond what the flower is to the whole of the plant,
and hints at the theme of interconnectedness behind the poem itself.

### Frog 42 (transl. Shunkichi Akimoto)

&nbsp;&nbsp;&nbsp;&nbsp;Into the old pond\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Leaps a frog\
Lo, the sound of the water.


![DALL-E 2 artwork for Frog 42, using the translation by Shunkichi Akimoto. This frog is a standard-bearer.](../../../assets/articles/frog-after-frog/frog-042.webp)

This frog is a standard-bearer. Perhaps he is accompanying a battalion
for a king or a general as they march into battle, ensuring that the
position of the army can be seen from afar by its commander. "Lo, the
sound of the water," as the battling frogs leap about in the pond.

### Frog 43 (transl. Peter Beilenson and Harry Behn)

AN OLD SILENT POND . . .\
&nbsp;&nbsp;&nbsp;&nbsp;INTO THE POND\
&nbsp;&nbsp;&nbsp;&nbsp;A FROG JUMPS,\
SPLASH! SILENCE AGAIN.


![DALL-E 2 artwork for Frog 43, using the translation by Peter Beilenson and Harry Behn. This was another translation which proved unstable, frequently generating messy and poor images.](../../../assets/articles/frog-after-frog/frog-043.webp)

This was another translation which proved unstable, frequently
generating messy and poor images. This output was intriguing to me. A
zen garden can be seen beneath a toad-green moon, with not only the
usual island of rock but also several lily pads and lotus flowers in
bloom. The Japanese dry gardens were a medieval invention, and were
highly curated representations of nature. The lotus flower is another
Buddhist symbol; it is said that they bloomed everywhere the young
Gautama Buddha stepped when he took his first steps. Here, lotus flowers
have appeared in the sands of a dry garden, an equally impossible event.
Perhaps it shows the aftermath of a monk having attained enlightenment
amidst gardening duty, walking away from it for the mosses to take over.

### Frog 44 (transl. Edward G. Seidensticker)

The quiet pond\
&nbsp;&nbsp;&nbsp;&nbsp;A frog leaps in,\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The sound of the water.


![DALL-E 2 artwork for Frog 44, using the translation by Edward G. Seidensticker. What appears to be a Kinugasa flying frog pushes a half-bloomed lotus flower down the stream.](../../../assets/articles/frog-after-frog/frog-044.webp)

What appears to be a Kinugasa flying frog pushes a half-bloomed lotus
flower down the stream. The composition of the image itself is
reminiscent of cover designs in modern Buddhist magazines (the use of
Buddhist symbols like the lotus flower, and the use of empty space).
Frogs are not particularly common in Buddhist literature. When they do
appear, usually as a devout Buddhist listening in on a monk's lecture,
they play the role of a lesser creature whose lowly station makes their
devotion to the Buddha's words all the more impressive. Here this frog
pushes a half-bloomed lotus flower down the stream, symbolising the
birth and expression of the Buddha's teaching, helped along not only by
impressive and grand gestures of great kings and patrons but also the
ordinary and smaller folk.

### Frog 45 (transl. Dion O\'Donnol)

![AYE, THE OLD POND AND A-FROG-THAT-IS-A-LEAPING-IN-THE-WATER](../../../assets/articles/frog-after-frog/frog-045-poem.webp)

![DALL-E 2 artwork for Frog 45, using the translation by Dion O'Donnol. While the modernistic translation makes use of rotated text to emulate the motion of a jumping frog with its final line, I had to settle for the extensively hyphenated chunk of text without the rotation when I inputted it into DALL-E.](../../../assets/articles/frog-after-frog/frog-045.webp)

While the modernistic translation makes use of rotated text to emulate
the motion of a jumping frog with its final line, I had to settle for
the extensively hyphenated chunk of text without the rotation when I
inputted it into DALL-E. It was not especially reliable as a prompt, but
produced this image of a boatman frog amidst a beautiful field of
aquatic plants.

### Frog 46 (transl. Harry Behn)

&nbsp;&nbsp;&nbsp;&nbsp;An old silent pond . . .\
A frog jumps into the pond,\
&nbsp;&nbsp;&nbsp;&nbsp;splash! Silence again.


![DALL-E 2 artwork for Frog 46, using the translation by Harry Behn. The word "silent" seems to introduce instability to the output, resulting in a lowered quality of artworks produced.](../../../assets/articles/frog-after-frog/frog-046.webp)

The word "silent" seems to introduce instability to the output,
resulting in a lowered quality of artworks produced. However,
instability also provides the additional variety that leads to wonderful
accidents like the blue frogs seen here.

### Frog 47 (transl. Geoffrey Bownas and Anthony Thwaite)

An old pond\
A frog jumps in—\
Sound of water.

![DALL-E 2 artwork for Frog 47, using the translation by Geoffrey Bownas and Anthony Thwaite. Winter is rare in the output produced by the Frog Haiku.](../../../assets/articles/frog-after-frog/frog-047.webp)

Winter is rare in the output produced by the Frog Haiku. But
commentators sometimes cite Bashō's use of a jumping frog as opposed to
a croaking frog as a subtle deviation from the convention of using frogs
as a summer word; at the end of winter, hibernating frogs wake and break
the thinning ice on the surface of the pond.

### Frog 48 (transl. Masaru V. Otake)

The old pond,\
Frog jumps in—\
The sound of water.

![DALL-E 2 artwork for Frog 48, using the translation by Masaru V. Otake. A plump, spotted frog looks up at a sky full of expensive objects.](../../../assets/articles/frog-after-frog/frog-048.webp)

A plump, spotted frog looks up at a sky full of expensive objects.
Decorative shoes and a fish made of silk; neatly rolled up scrolls; a
lacquered table. It's a prosperous image.

### Frog 49 (transl. Nobuyuki Yuasa)

Breaking the silence\
Of an ancient pond,\
A frog jumped into water—\
A deep resonance.

![DALL-E 2 artwork for Frog 49, using the translation by Nobuyuki Yuasa. This frog appears to be looking directly at the viewer, its cheeky expression and glinting eye suggesting that it will enjoy breaking the silence of the ancient pond.](../../../assets/articles/frog-after-frog/frog-049.webp)

This frog appears to be looking directly at the viewer, its cheeky
expression and glinting eye suggesting that it will enjoy breaking the
silence of the ancient pond.

### Frog 50 (transl. Scott Alexander)

By an ancient pond\
a bullfrog sits on a rock\
waiting for Basho?

![DALL-E 2 artwork for Frog 50, using the translation by Scott Alexander. The arrangement of the porous rock and the manicured branches suggest that this is a carefully maintained garden pond.](../../../assets/articles/frog-after-frog/frog-050.webp)

The arrangement of the porous rock and the manicured branches suggest
that this is a carefully maintained garden pond. The pond itself seems
to be covered in a thin layer of ice, placing the scene somewhere
between winter and spring.

### Frog 51 (transl. Sylvia Cassedy and Kunihiro Suetake)

Old pond, blackly still—\
frog, plunging into water,\
splinters silent air.

![DALL-E 2 artwork for Frog 51, using the translation by Sylvia Cassedy and Kunihiro Suetake. The translation did not result in many notable artworks, and some of the resulting frogs were rather unsightly.](../../../assets/articles/frog-after-frog/frog-051.webp)

The translation did not result in many notable artworks, and some of the
resulting frogs were rather unsightly. The best images of the lot tended
to be minimalistic sketches with a childlike lack of skill.

### Frog 52 (transl. Sylvia Cassedy and Kunihiro Suetake)

Old pond:\
frog jump in\
water-sound.

![DALL-E 2 artwork for Frog 52, using the translation by Sylvia Cassedy and Kunihiro Suetake. A flute-patterned frog hops onto a flute-shaped bamboo tree.](../../../assets/articles/frog-after-frog/frog-052.webp)

A flute-patterned frog hops onto a flute-shaped bamboo tree. Bamboo
leaves bristle in the wind above, helping to make visual the musical
sound of the wind.

### Frog 53 (transl. Dion O\'Donnol)

&nbsp;&nbsp;&nbsp;&nbsp;The silent old pond\
a mirror of ancient calm,\
&nbsp;&nbsp;&nbsp;&nbsp;a frog-leaps-in splash . . .


![DALL-E 2 artwork for Frog 53, using the translation by Dion O'Donnol. This translation, featuring both the words "silent" and "ancient", predictably resulted in an unstable array of output which left much to be desired in the way of artistic interest.](../../../assets/articles/frog-after-frog/frog-053.webp)

This translation, featuring both the words "silent" and "ancient",
predictably resulted in an unstable array of output which left much to
be desired in the way of artistic interest. This image stood out in
particular because it veered far too closely toward photography compared
to the rest.

### Frog 54 (transl. Anonymous)

The old pond.\
A frog jumps into the water—\
SPLASH.

![DALL-E 2 artwork for Frog 54, using the translation by Anonymous. This frog is looking up at the sky with a pleading expression.](../../../assets/articles/frog-after-frog/frog-054.webp)

This frog is looking up at the sky with a pleading expression. Both in
Japan and Korea, frogs are thought to be able to predict the future,
because they croak before rainfall. According to a famous Korean
folktale (a variant of a Chinese folktale), there was a disobedient frog
who always did the opposite of what his mother told him to do. One day,
she asked him to bury her at the river bank when she died, hoping that
he would disobey her and bury her on a sunny hill instead. But the frog
was so struck with grief upon her death that he respected her wish
instead. From that day on, whenever it rained, the frog would cry and
plead at the sky to stop: he was worried that the rain would wash his
mother's grave away. The term *cheong-gaeguri* (청개구리, "green frog")
is a popular turn of phrase used to this day by Korean parents to
describe rebellious children, because the frog in the folktale was said
to be green.

### Frog 55 (transl. Edward Bond)

Silent old pool\
Frog jumps\
Kdang!

![DALL-E 2 artwork for Frog 55, using the translation by Edward Bond. Curiously, this translation produced numerous frogs riding on various long and flat objects such as carpets, boards, rocks, leaves, and kites.](../../../assets/articles/frog-after-frog/frog-055.webp)

Curiously, this translation produced numerous frogs riding on various
long and flat objects such as carpets, boards, rocks, leaves, and kites.

### Frog 56 (transl. Cana Maeda)

old pond\
&nbsp;&nbsp;&nbsp;&nbsp;a frog in-leaping\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;water-note


![DALL-E 2 artwork for Frog 56, using the translation by Cana Maeda. A pensive frog is deep in thought, resting its chin on an arm and its eyes looking to the bottom right.](../../../assets/articles/frog-after-frog/frog-056.webp)

A pensive frog is deep in thought, resting its chin on an arm and its
eyes looking to the bottom right. It's said that people look to the
bottom right when they're recalling some sensory or emotional
experience. Perhaps this frog is contemplating the sound of the water.

### Frog 57 (transl. G. S. Fraser)

The old pond, yes, and\
A frog is jumping into\
The water, and splash.

![DALL-E 2 artwork for Frog 57, using the translation by G. S. Fraser. A frog clasps its hands together as it readies for a skillful dive.](../../../assets/articles/frog-after-frog/frog-057.webp)

A frog clasps its hands together as it readies for a skillful dive. I
wonder what the scroll hanging from the branch reads. Perhaps it's a
swimming competition. The morphological similarity of the frog to
humans, particularly when diving and swimming, must have made it easy to
anthropomorphise. In the West, frogs and toads were sometimes depicted
as religious congregations, variously holy and heretical. Frogs have
occasionally been depicted as clergy in Japan also.

### Frog 58 (transl. G. S. Fraser)

Old pond, yes, and\
Frog jumping into\
The water\'s noise.

![DALL-E 2 artwork for Frog 58, using the translation by G. S. Fraser. A labyrinth stretches across the background of this otherwise simplistic scenery.](../../../assets/articles/frog-after-frog/frog-058.webp)

A labyrinth stretches across the background of this otherwise simplistic
scenery. The concept of a labyrinth is not endemic to East Asia, instead
being imported by Jesuits as a curiosity, occasionally constructed for
the amusement of royals. It was understood by the Asian audience as a
special class of gardens (the winding movement of the explorers of a
labyrinth was deemed similar to a garden walk), and akin to a palace on
a more abstract level (palaces are sprawling complexes of walls and
buildings). Here, instead of the labyrinth, only some clouds are
reflected in the water; a humorous comparison between a labyrinth and a
garden, evidently not quite the same thing.

### Frog 59 (transl. G. S. Fraser)

Old pond, yes,\
Frog there jumping,\
Water\'s noise.

![DALL-E 2 artwork for Frog 59, using the translation by G. S. Fraser. A lonesome frog looks up at the moon and sees its beloved.](../../../assets/articles/frog-after-frog/frog-059.webp)

A lonesome frog looks up at the moon and sees its beloved. It was
believed by some cultures that the moon controls the passage of time, as
the lunar calendar depended on the movement of the moon. In some pacific
cultures, it was traditional for people to throw spears at the moon to
hasten its movement in order to bring back friends who had left home for
work or travel. In some East Asian myths, the moon would send wives to
lonely but virtuous bachelors; it would sometimes take them back,
causing the grieving husband to watch it with longing, night after
night. The perfectly formed character on the top right of this image
simply reads 目 ("eye").

### Frog 60 (transl. Armando Martins Janeira)

Ah, the old pond\
A frog jumps in\
Sound of water.

![DALL-E 2 artwork for Frog 60, using the translation by Armando Martins Janeira. Here is another winter scene, complete with falling snow and a chubby frog scurrying along to get away from the freezing cold.](../../../assets/articles/frog-after-frog/frog-060.webp)

Here is another winter scene, complete with falling snow and a chubby
frog scurrying along to get away from the freezing cold. Perhaps it
awoke a little too soon from hibernation.

### Frog 61 (transl. Makoto Ueda)

The old pond—\
A frog leaps in,\
And a splash.

![DALL-E 2 artwork for Frog 61, using the translation by Makoto Ueda. An affluent merchant frog waits for its customers with some choice products laid out on the storefront.](../../../assets/articles/frog-after-frog/frog-061.webp)

An affluent merchant frog waits for its customers with some choice
products laid out on the storefront. It's selling some fish it caught,
surely a delicacy for land creatures.

### Frog 62 (transl. William J. Higginson)

Old pond . . .\
&nbsp;&nbsp;&nbsp;&nbsp;a frog leaps in\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;water\'s sound.


![DALL-E 2 artwork for Frog 62, using the translation by William J. Higginson. This dainty little friend looks familiar.](../../../assets/articles/frog-after-frog/frog-062.webp)

This dainty little friend looks familiar. It's the mousey frog, who
seems to be one of the recurring characters in the AI haiku art world.
It's watching a sunrise as it relaxes under the artificial waterfall
made of hollowed out bamboo with its friend, the hot spring monkey.

### Frog 63 (transl. Robert H. Brower)

&nbsp;&nbsp;&nbsp;&nbsp;The ancient pond;\
A frog jumps in—\
&nbsp;&nbsp;&nbsp;&nbsp;The sound of water.


![DALL-E 2 artwork for Frog 63, using the translation by Robert H. Brower. This plump, pistachio coloured frog covered with white dots is yet another recurring character.](../../../assets/articles/frog-after-frog/frog-063.webp)

This plump, pistachio coloured frog covered with white dots is yet
another recurring character. It seems to enjoy sitting and looking at
the pond, preferably beneath the shade of a large leaf. The word
"ancient" seems to invoke it with some reliability, as the shape and
pattern of its body is similar to ancient Japanese clothing worn by
aristocrats.

### Frog 64 (transl. William Howard Cohen)

Mossy pond;\
frog leaping in—\
splash!

![DALL-E 2 artwork for Frog 64, using the translation by William Howard Cohen. A sheet of clear water wraps around the frog as it breaks the surface of the pond.](../../../assets/articles/frog-after-frog/frog-064.webp)

A sheet of clear water wraps around the frog as it breaks the surface of
the pond. The shape of its body is barely visible, mostly a green blur
save for the eye. The sense of speed depicted here is certainly
innovative if not entirely anachronistic.

### Frog 65 (transl. Kenjun Ikeda)

The old pond!\
A frog jumps in\
With splash-splosh.

![DALL-E 2 artwork for Frog 65, using the translation by Kenjun Ikeda. Three frogs consider the pond with varying degrees of enthusiasm.](../../../assets/articles/frog-after-frog/frog-065.webp)

Three frogs consider the pond with varying degrees of enthusiasm.
Perhaps they are the same frog at different stages of splash-sploshing.

### Frog 66 (transl. Daniel C. Buchanan)

Into the old pond\
A frog suddenly plunges.\
The sound of water.

![DALL-E 2 artwork for Frog 66, using the translation by Daniel C. Buchanan. The exaggerated dynamism of the frog as its tongue whips out in an arc makes it almost look like the scene was captured with a fisheye lens.](../../../assets/articles/frog-after-frog/frog-066.webp)

The exaggerated dynamism of the frog as its tongue whips out in an arc
makes it almost look like the scene was captured with a fisheye lens. A
shallower depth of field like this, with the objects in the background
given far less attention than the closer object, is atypical of the
medium. It makes the image look more like a frame of a stylised
animation than a woodblock print.

### Frog 67 (transl. Dorothy Britton)

Listen! a frog\
&nbsp;&nbsp;&nbsp;&nbsp;Jumping into the stillness\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Of an ancient pond!


![DALL-E 2 artwork for Frog 67, using the translation by Dorothy Britton. A full moon shines in a cloudless night sky as a frog of the same colour admires it.](../../../assets/articles/frog-after-frog/frog-067.webp)

A full moon shines in a cloudless night sky as a frog of the same colour
admires it. On a leaf to the left, a droplet of water glistens like a
jewel; the oval shapes of the leaves, the droplet, and the moon draw the
eye from the bottom left to the centre, then to the frog, then to the
droplet again, forming a perfect triangle between the three foci.

### Frog 68 (transl. Joan Giroux)

An old pond\
A frog jumps in\
The sound of the water.

![DALL-E 2 artwork for Frog 68, using the translation by Joan Giroux. Vivid spots of white flowers stand out against the otherwise dark image.](../../../assets/articles/frog-after-frog/frog-068.webp)

Vivid spots of white flowers stand out against the otherwise dark image.
The numerous lotus leaves and the yellow frog are diminished in a
tasteful way.

### Frog 69 (transl. Alfred H. Marks)

The old pond:\
A frog jumps in,—\
The sound of the water

![DALL-E 2 artwork for Frog 69, using the translation by Alfred H. Marks. See the joyous expression on this frog's face as it admires the autumnal sunset.](../../../assets/articles/frog-after-frog/frog-069.webp)

See the joyous expression on this frog's face as it admires the autumnal
sunset. The dash of pink blush across its face completes the playful
scene.

### Frog 70 (transl. Alfred H. Marks)

There once was a curious frog\
Who sat by a pond on a log\
And, to see what resulted,\
In the pond catapulted\
With a water-noise heard round the bog.

![DALL-E 2 artwork for Frog 70, using the translation by Alfred H. Marks. This image depicts a stolid creature that resembles a toad more than it does a frog.](../../../assets/articles/frog-after-frog/frog-070.webp)

This image depicts a stolid creature that resembles a toad more than it
does a frog. In Korea and Japan, round rock formations were often named
the "toad rock" of a village or a mountain, and regarded with reverence
for their power to decide the luck of those who lived nearby. There are
even records of villagers waging battle over which direction a toad rock
should face, because it was sometimes believed that the village to the
direction of its rear would prosper and the village to its mouth would
suffer from unfaithful wives.

### Frog 71 (transl. Robert Aitken)

Old pond ! / Frog jumps in / Water \'s sound

![DALL-E 2 artwork for Frog 71, using the translation by Robert Aitken. An adorable little frog sits on a butterbur leaf.](../../../assets/articles/frog-after-frog/frog-071.webp)

An adorable little frog sits on a butterbur leaf. Judging by the plants
(they aren't aquatic) and the shape of the waves, this is a flood. The
grainy texture of the print suggests that the ink was not applied
correctly by the printmaker, resulting in slippage and poor transfer.

### Frog 72 (transl. Robert Aitken)

&nbsp;&nbsp;&nbsp;&nbsp;The old pond;\
A frog jumps in,—\
&nbsp;&nbsp;&nbsp;&nbsp;The sound of the water.


![DALL-E 2 artwork for Frog 72, using the translation by Robert Aitken. A travelling scholar on his way to Hanyang (한양, the capital of medieval Korea) for a bureaucratic examination has come across an enormous frog.](../../../assets/articles/frog-after-frog/frog-072.webp)

A travelling scholar on his way to Hanyang (한양, the capital of
medieval Korea) for a bureaucratic examination has come across an
enormous frog. The frog is no doubt a magical creature, with a problem
which the scholar must resolve through his own wit and moral goodness.
This is a common motif in many Korean folktales, and is distinguished
from Japanese monster stories and *kaidan* (怪談) by the neo-Confucian
moral lessons they imparted. *Kaidan* on the other hand were inspired by
*samurai* Buddhism: used as part of story-trading games such as
*Hyakumonogatari Kaidankai* (百物語怪談会, lit. "A Gathering of One
Hundred Supernatural Tales"), which tested the participants' courage,
they were intended to be frightening and thus did not always contain
discrete moral lessons (the story-trading games, of course, were
moralistic in nature insofar as they promoted courage and community
amongst the players). The game and the stories were both a common
subject matter for printmaking masters, who produced many scenes of
nightmarish encounters with the supernatural based on the stories.

### Frog 73 (transl. Robert Aitken)

The old pond has no walls.\
The frog simply jumped in,\
And his sound does not echo at all.

![DALL-E 2 artwork for Frog 73, using the translation by Robert Aitken. The thought-terminating cliche about dissecting frogs and explaining jokes belies the fact that the greatest masters of every craft, not the least comics and satirists, study and explain to one another their favourite works.](../../../assets/articles/frog-after-frog/frog-073.webp)

The thought-terminating cliche about dissecting frogs and explaining
jokes belies the fact that the greatest masters of every craft, not the
least comics and satirists, study and explain to one another their
favourite works. Haiku writing is another such tradition. The
collaborative nature of haiku encouraged poetry written in direct
response to other poems, and having the contextual information explained
is sometimes essential to the enjoyment of a poem.

### Frog 74 (transl. Felix-Marti Ibanez)

*The old pond!*\
&nbsp;&nbsp;&nbsp;&nbsp;*A frog jumps:*\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Sound of water!*


![DALL-E 2 artwork for Frog 74, using the translation by Felix-Marti Ibanez. The reflected moon envelopes a frog like a halo.](../../../assets/articles/frog-after-frog/frog-074.webp)

The reflected moon envelopes a frog like a halo. A halo was
traditionally depicted in Eastern art as a form of fire, with flames and
light; in Western art, it was depicted as a holy glow. Is the reflection
intrinsic to the pond, or the moon? The same question is asked through
the poem itself: is the sound of the water intrinsic to the pond, or the
frog?

### Frog 75 (transl. Lucien Stryk and Takashi Ikemoto)

Old pond,\
leap-splash—\
a frog.

![DALL-E 2 artwork for Frog 75, using the translation by Lucien Stryk and Takashi Ikemoto. A frog considers the long journey across the pond, marked by a trail of lily pads.](../../../assets/articles/frog-after-frog/frog-075.webp)

A frog considers the long journey across the pond, marked by a trail of
lily pads. Its eyes are determined.

### Frog 76 (transl. Robert Aitken)

The old pond;\
A frog jumps in—\
The sound of the water.

![DALL-E 2 artwork for Frog 76, using the translation by Robert Aitken. A humorous scene featuring Frug, a recurring character in this series.](../../../assets/articles/frog-after-frog/frog-076.webp)

A humorous scene featuring Frug, a recurring character in this series.
He admires the full moon in the clear evening sky. It is bright and
round, shaped just like the frog.

### Frog 77 (transl. Robert Aitken)

#### (word-for-word)

Old pond!\
frog jumps in\
water of sound

![DALL-E 2 artwork for Frog 77, using the translation by Robert Aitken. This translation is labelled "word-for-word".](../../../assets/articles/frog-after-frog/frog-077.webp)

This translation is labelled "word-for-word". Its almost-correct grammar
seems to be a little confusing for the model, which responded by
generating more human figures, bright colours, and frogs with distorted
shapes.

### Frog 78 (transl. Robert Aitken)

The old pond has no walls;\
A frog just jumps in;\
Do you say there is an echo?

![DALL-E 2 artwork for Frog 78, using the translation by Robert Aitken. The model seems to think that baby frogs are small, pale, and delicate versions of the green and sharp adult frogs.](../../../assets/articles/frog-after-frog/frog-078.webp)

The model seems to think that baby frogs are small, pale, and delicate
versions of the green and sharp adult frogs. I can see why it would
think that, given how nicely the combination looks in the images.

### Frog 79 (transl. Earl Miner)

&nbsp;&nbsp;&nbsp;&nbsp;The still old pond\
and as a frog leaps in it\
&nbsp;&nbsp;&nbsp;&nbsp;the sound of a splash


![DALL-E 2 artwork for Frog 79, using the translation by Earl Miner. The lily pads continue beyond the bounds of the pond, sprawling into both the sky and the ground.](../../../assets/articles/frog-after-frog/frog-079.webp)

The lily pads continue beyond the bounds of the pond, sprawling into
both the sky and the ground. The moon hangs low amongst the plants, its
perfectly circular shape suggesting that this is not a reflection. The
distinction between the nominally separate entities is thus made
ambiguous in an exaggerated manner, as with the case in the moment
captured by Bashō in his poem.

### Frog 80 (transl. Allen Ginsberg)

The old pond\
A frog jumped in,\
Kerplunk!

![DALL-E 2 artwork for Frog 80, using the translation by Allen Ginsberg. A diving frog sneaks toward koi with a fishing net, its determined gaze fixed on the unwitting fish.](../../../assets/articles/frog-after-frog/frog-080.webp)

A diving frog sneaks toward koi with a fishing net, its determined gaze
fixed on the unwitting fish. The translation produced several scenes
with humorous narratives.

### Frog 81 (transl. Earl Miner and Hiroko Odagiri)

&nbsp;&nbsp;&nbsp;&nbsp;The old pond is still\
a frog leaps right into it\
&nbsp;&nbsp;&nbsp;&nbsp;splashing the water


![DALL-E 2 artwork for Frog 81, using the translation by Earl Miner and Hiroko Odagiri. While frogs are unusual in Buddhist art, fish are much more common.](../../../assets/articles/frog-after-frog/frog-081.webp)

While frogs are unusual in Buddhist art, fish are much more common. The
twin fish, originating from Babylonian mythology, was passed on through
the Middle East and India into East Asia, where it was incorporated into
temple art. Temples in East Asia are built out of wood, as were many of
the treasures such as printing blocks containing scriptures. The use of
aquatic animals in East Asian temple art reflected a wish to ward off
fires and protect the treasures.

### Frog 82 (transl. Yoko Danno)

Old-pond—a frog\
leaps in\
water sound

![DALL-E 2 artwork for Frog 82, using the translation by Yoko Danno. This was the only occurrence of a tadpole out of the approximately 2000 frogs which I generated throughout the research.](../../../assets/articles/frog-after-frog/frog-082.webp)

This was the only occurrence of a tadpole out of the approximately 2000
frogs which I generated throughout the research. The spotted pattern,
particularly the white and green, was much more common.

### Frog 83 (transl. Bill Deemer)

I enlightened Bashō,\
recalled the Frog,\
but he scared me!

![DALL-E 2 artwork for Frog 83, using the translation by Bill Deemer. A common motif in Buddhist legends is for an animal to skip the queue of rebirth through an act of exceptional piety, such as helping a monk reach enlightenment.](../../../assets/articles/frog-after-frog/frog-083.webp)

A common motif in Buddhist legends is for an animal to skip the queue of
rebirth through an act of exceptional piety, such as helping a monk
reach enlightenment. This frog seems to have been reborn in a higher
realm after helping to enlighten Bashō.

### Frog 84 (transl. Bernard Lionel Einbond)

Antic pond—\
frantic frog jumps in—\
gigantic sound.

![DALL-E 2 artwork for Frog 84, using the translation by Bernard Lionel Einbond. The child in blue taking a frog-dog (drog? Fruppy?) looks an awful lot like "Madeline", by Ludwig Bemelmans.](../../../assets/articles/frog-after-frog/frog-084.webp)

The child in blue taking a frog-dog (drog? Fruppy?) looks an awful lot
like "Madeline", by Ludwig Bemelmans. Needless to say, the children's
story from the late 1930s is anachronistic in this context.

### Frog 85 (transl. Bernard Lionel Einbond)

Unable to sleep—\
I imagine an old pond,\
and a frog jumps in.

![DALL-E 2 artwork for Frog 85, using the translation by Bernard Lionel Einbond. We are permitted a peek into a sleeping frog's inner world as it dreams of flying through the pine trees in the moonlit night.](../../../assets/articles/frog-after-frog/frog-085.webp)

We are permitted a peek into a sleeping frog's inner world as it dreams
of flying through the pine trees in the moonlit night.

### Frog 86 (transl. Ross Figgins)

1\. After working with this for a while, I can\'t resist a pun. I don\'t
know the legitimacy of word plays in translations, but . . .\
\
old pond,\
&nbsp;&nbsp;&nbsp;&nbsp;frog jump in—\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a sound question


![DALL-E 2 artwork for Frog 86, using the translation by Ross Figgins. This print appears to be incomplete, and painted over with a brush and acrylic paint.](../../../assets/articles/frog-after-frog/frog-086.webp)

This print appears to be incomplete, and painted over with a brush and
acrylic paint. The brushstrokes of the flowers and the flat print of the
frog garnish the coarsely textured fabric.

### Frog 87 (transl. Bernard Lionel Einbond)

2\. The next is an attempt to capture the sound by bracketing it between
the interrupted moments of silence. The ambiguity is intended.\
\
old pond,\
&nbsp;&nbsp;&nbsp;&nbsp;a frog leaps in—\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a moment after, silence


![DALL-E 2 artwork for Frog 87, using the translation by Bernard Lionel Einbond. Autumn leaves fall onto the rocks like so many flowers blooming out of a muddy pool.](../../../assets/articles/frog-after-frog/frog-087.webp)

Autumn leaves fall onto the rocks like so many flowers blooming out of a
muddy pool. This frog can sense the cooling weather, and begins to
prepare for the winter.

### Frog 88 (transl. Bernard Lionel Einbond)

3\. And finally a more literal interpretation.\
\
&nbsp;&nbsp;&nbsp;&nbsp;old pond—\
the sound\
&nbsp;&nbsp;&nbsp;&nbsp;of a frog and water


![DALL-E 2 artwork for Frog 88, using the translation by Bernard Lionel Einbond. A frog on holiday admires its garden from an engawa (縁側), a type of low veranda.](../../../assets/articles/frog-after-frog/frog-088.webp)

A frog on holiday admires its garden from an *engawa* (縁側), a type of
low veranda. The trees and the oiled paper umbrella provide shade from
the blazing summer sun. The image has a "widescreen" aspect ratio (it is
letterboxed between two rectangles). As a still image, it resembles a
postcard (4" x 6"); however, it is not uncommon for contemporary video
editors to sometimes introduce letterboxing into standard format footage
in order to create a semblance of the video being produced for the big
screen. The framing seems appropriate here.

### Frog 89 (transl. wm Flygare)

ab-sence&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(samsara)\
bare attention&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(satipatthana)\
presence&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(nirvana)

![DALL-E 2 artwork for Frog 89, using the translation by wm Flygare. In spite of the Japanese original being included alongside the English translation, the prompt did not reliably produce frogs.](../../../assets/articles/frog-after-frog/frog-089.webp)

In spite of the Japanese original being included alongside the English
translation, the prompt did not reliably produce frogs. Perhaps this is
a frog that transformed into a woman in order to marry into humanity.

### Frog 90 (transl. wm Flygare)

the wordless Word:\
a frog-pond plop\
makes it heard.

![DALL-E 2 artwork for Frog 90, using the translation by wm Flygare. A magical frog guides Bashō through the writing process, wielding a gigantic brush pen made of a bamboo tree.](../../../assets/articles/frog-after-frog/frog-090.webp)

A magical frog guides Bashō through the writing process, wielding a
gigantic brush pen made of a bamboo tree. This is a representation of
genius, in the Roman sense of the particular guiding spirits inherent in
things, places, activities, phenomena. This must be the genius of
*haiku*.

### Frog 91 (transl. wm Flygare)

nay\
yea\
aye

![DALL-E 2 artwork for Frog 91, using the translation by wm Flygare. Despite the original Japanese poem by Bashō being included in the prompt, This translation persistently produced fish (and fish-like creatures with legs) along with fishermen in ancient clothing.](../../../assets/articles/frog-after-frog/frog-091.webp)

Despite the original Japanese poem by Bashō being included in the
prompt, This translation persistently produced fish (and fish-like
creatures with legs) along with fishermen in ancient clothing. It was a
baffling result. While fish were far more common than frogs in Buddhist
art, it's unclear what about the translation led the model to replace
the frogs with fish.

### Frog 92 (transl. wm Flygare)

?\
!\
.

![DALL-E 2 artwork for Frog 92, using the translation by wm Flygare. Once again, fish and fishermen appeared in many of the output.](../../../assets/articles/frog-after-frog/frog-092.webp)

Once again, fish and fishermen appeared in many of the output. This
well-formed blue carp was quite the catch. The ultra-minimalistic
translation by Flygare seems to have been confusing for the model; it's
hard to appreciate the humour when you don't retain any memory of the
previous 91 translations.

### Frog 93 (transl. Lorraine Ellis Harr)

Mossy pond:\
&nbsp;&nbsp;&nbsp;&nbsp;Plunging frog's\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;water-blip.


![DALL-E 2 artwork for Frog 93, using the translation by Lorraine Ellis Harr. A spotted frog sits on a log, in a pond full of fish and flowers.](../../../assets/articles/frog-after-frog/frog-093.webp)

A spotted frog sits on a log, in a pond full of fish and flowers. The
shape of the pond frames them like a halo behind a sacred figure's head
might have done in a religious painting. A pond or a garden may well be
a form of sculptural halo in the sense that they enable the technique of
"borrowed scenery" in Chinese-influenced garden architectures, in which
scenery is framed and presented for viewing by the features of a garden.

### Frog 94 (transl. Lindley Williams Hubbel)

An old pond\
A frog jumping\
Sound of water

![DALL-E 2 artwork for Frog 94, using the translation by Lindley Williams Hubbel. A ceramic painting shows a frog floating towards a snow-capped mountain on a block of ice.](../../../assets/articles/frog-after-frog/frog-094.webp)

A ceramic painting shows a frog floating towards a snow-capped mountain
on a block of ice. It may have awoken a little too early into
springtime.

### Frog 95 (transl. Lindley Williams Hubbel)

Oh thou unrippled pool of quietness\
Upon whose shimmering surface, like the tears\
Of olden days, a small batrachian leaps,\
The while aquatic sounds assail our ears.

![DALL-E 2 artwork for Frog 95, using the translation by Lindley Williams Hubbel. A mousey and gentle frog looks to the distance as a frog-coloured sun sets into the endless stretch of water.](../../../assets/articles/frog-after-frog/frog-095.webp)

A mousey and gentle frog looks to the distance as a frog-coloured sun
sets into the endless stretch of water. This is a not a pond but a lake
or a river. The lotus flower was associated with the rebirth of day in
Egypt (and the frog with fertility); here, they have closed for the
night, and will bloom again at dawn.

### Frog 96 (transl. Hisako Kanaseki)

an old pond:\
noises of frogs\
leaping in

![DALL-E 2 artwork for Frog 96, using the translation by Hisako Kanaseki. Ethereal, almost translucent frogs swim in a pond beneath a hanging branch.](../../../assets/articles/frog-after-frog/frog-096.webp)

Ethereal, almost translucent frogs swim in a pond beneath a hanging
branch. While the ground is clearly visible in the bottom left corner,
the pond itself is represented only by the aquatic plants and the
swimming frogs. It makes you wonder whether Bashō could see the frogs as
he was composing his poem; the question is still brought up from time to
time in the discourse around the poem.

### Frog 97 (transl. James Kirkup)

&nbsp;&nbsp;&nbsp;&nbsp;pond\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;frog\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;plop!


![DALL-E 2 artwork for Frog 97, using the translation by James Kirkup. A forager frog has found a lotus flower.](../../../assets/articles/frog-after-frog/frog-097.webp)

A forager frog has found a lotus flower. The cartoonish facial
expression and the exaggerated movement of the legs mid-action bring out
the buoyant personality in the character's design. Every part of the
lotus plant is either edible or used as a cooking ingredient, as well as
for making tea. Judging by the size of the frog, this find will keep it
fed for quite a while.

### Frog 98 (transl. Frank Kuenstler)

Once upon a time there was a frog\
Once upon a time there was a pond\
*Splash.*

![DALL-E 2 artwork for Frog 98, using the translation by Frank Kuenstler. Two intelligent looking frogs consider a hilly path.](../../../assets/articles/frog-after-frog/frog-098.webp)

Two intelligent looking frogs consider a hilly path. The larger, older
frog stares into the distance as the smaller, younger frog follows not
far behind, carrying a pack made of straw. They are carrying uncurved
swords, suggesting that the scene is set around the 10th Century prior
to the curved, Mongol style swords displaced uncurved, Chinese style
blades. Indeed, the translation places these frogs in the "once upon a
time" period, and it can be inferred that this is a classical knight's
tale.

### Frog 99 (transl. William Matheson)

Jumpe, jumpe, lyttle Frogge!\
Water soundeth\
All aroundeth\
In thyss olde Bogge.

![DALL-E 2 artwork for Frog 99, using the translation by William Matheson. Sumo wrestling is one of the oldest sports in Japan.](../../../assets/articles/frog-after-frog/frog-099.webp)

Sumo wrestling is one of the oldest sports in Japan. Champion *rikishi*
(力士, professional sumo wrestlers) were celebrities, and the demand for
images of the *rikishi* resulted in many woodblock prints. The influence
is evident in this image of the sumo wrestler frog.

### Frog 100 (transl. wm Flygare)

the universe . . .\
a froglet moves it\
listen! . . . . . .

![DALL-E 2 artwork for Frog 100, using the translation by wm Flygare. Here is the lever long enough to move the world that Archimedes asked for.](../../../assets/articles/frog-after-frog/frog-100.webp)

Here is the lever long enough to move the world that Archimedes asked
for. It has a frog for a fulcrum. The interpretation of the poem offered
by this particular translation and image is clear: even a little frog
can move the universe in some small way; one need only to listen to
understand that every thing in the world has some capacity to move its
own universe. Buddha nature is intrinsic not only to humans but to all
living things, and to the ponds they live in, to the splash they create,
to the listening, to the moving.

## VI. Conclusion

The results of the experiment support the hypothesis that "prompts
containing different translations of the same sentence will yield
results from DALL-E that vary in some useful way for artists." I found
the variation in the output introduced by the translations intriguing
and inspiring, not only in terms of new visual ideas but also as anchors
for meditations on art history and aesthetics.

The utility of AI-generated art, like other tools useful to the artist,
is not in "blurring the boundaries between art and non-art" or "raising
questions about what art is". These are tired questions that encourage a
preemptive disengagement with what is actually new in aesthetic
technology. They don't require the participants to so much as engage
with the new technology, but to merely place it into a preconceived
framework. At the same time, the utility of AI-generated art is not
merely that it enables them to do more with less time and effort. One
way AI-generated art is truly novel is in its inversion of the relation
between the artist and the art critic; art historical knowledge becomes
essential for the artist, and they can no longer do without art
criticism, because criticism is now part of the productive process of
art. It thus augments the process of two-way translation between art and
criticism; and art becomes criticism, and criticism becomes art.

At the same time, prompt engineering and generative art allows for what
may be called a *metamagical realist* epistemology: just as search
engines adapted to regular user behaviour (of anthropomorphising the
search interface) over the years to no longer require "Google-fu" style
syntactical tinkering, generative AI models can accommodate (and often
excel with) naive, conversational prompting from their users; as AI
facilitates the translation between magical thinking and machinic
processing, magical thinking becomes a pragmatic necessity. When
treating technology as magic is effective for its users, and that same
technology reflexively adapts to further improve upon this interface, it
is not technology which becomes indistinguishable from magic, but magic
which becomes technology. Rather than the boundaries between art and
non-art, such a development blurs the boundaries between the past and
the future.

## References

1. <span id="reference-1"></span> OpenAI, 2021. “DALL·E: Creating images from text.“ <https://openai.com/blog/dall-e/>

2. <span id="reference-2"></span> <https://labs.openai.com/>

3. <span id="reference-3"></span> Liu, P., Yuan W., Fu J. et al., 2021. “Pre-train, Prompt, and Predict: A Systematic Survey of Prompting Methods in Natural Language Processing.” <https://arxiv.org/abs/2107.13586>

4. <span id="reference-4"></span> Snell, C., 2021. “Understanding VQ-VAE (DALL-E Explained Pt. 1).“ <https://ml.berkeley.edu/blog/posts/vq-vae/>

5. <span id="reference-5"></span> van den Oord, A., Vinyals, O. & Kavukcuoglu, K., 2017. “Neural Discrete Representation Learning.” <https://arxiv.org/abs/1711.00937>

6. <span id="reference-6"></span> Blackmur, R.P., 1983. *Studies in Henry James*. Makowsky, V., eds. New York: New Directions.

7. <span id="reference-7"></span> Daras, G. & Dimakis, A., 2022. “Discovering the Hidden Vocabulary of DALLE-2.“ <https://arxiv.org/abs/2206.00169>

8. <span id="reference-8"></span> Quotation in Sato, H., 1983. *One Hundred Frogs: From Renga to Haiku to English*.

9. <span id="reference-9"></span> Susumu Takiguchi. 2017. “A Contrarian View On Basho’s Frog Haiku.” <https://poetrysociety.org.nz/affiliates/haiku-nz/haiku-poems-articles/archived-articles/a-contrarian-view-on-bashos-frog-haiku/>

10. <span id="reference-10"></span> Hasegawa Kai, 2016. “The Haiku Universe: On Nature.“ Trans. by Cheryl A. Crowley. *Modern Haiku*. Volume 47: 3

11. <span id="reference-11"></span> Shirane, H., 2006. “Double Voices and Bashō’s Haikai“ pp. 113-114, in: Kerkham, E., ed. *Matsuo Bashō’s Poetic Spaces: Exploring Haikai Intersections*. Palgrave Macmillan, New York. <https://doi.org/10.1057/9780230601871_6>

12. <span id="reference-12"></span> Mukhopadhyay, A., 2019. “Basho’s Creative Efflorescence: Haiku and Haibun.” <https://sites.google.com/site/worldhaikureview2/whr-december-2019-issue/general-common-room>

13. <span id="reference-13"></span> Quoted in “The Haiku Universe: On Nature“.

14. <span id="reference-14"></span> Ishigami, A., & Buckland, R., 2013. “The Reception of ‘Shunga’ in the Modern Era: From Meiji to the Pre-WWII Years.” *Japan Review*, no. 26, 2013, pp. 37–55. *JSTOR*, <http://www.jstor.org/stable/41959816>. Accessed 6 Sep. 2022.

15. <span id="reference-15"></span> Fiorillo, J., 1999. “Shin Hanga (新版画) "New Prints".“ Viewing Japanese Prints. <https://viewingjapaneseprints.net/texts/shin_hanga/intro_shin.html>

16. <span id="reference-16"></span> Japan Copyright Office (JCO), Agency for Cultural Affairs, Government of Japan, 2022. “II. HISTORY OF COPYRIGHT SYSTEMS IN JAPAN.“ *Copyright System in Japan*. Copyright Research and Information Center. <https://www.cric.or.jp/english/csj/csj2.html>

17. <span id="reference-17"></span> Fiorillo, J., 1999. “Shin Hanga (新版画) "New Prints"“ Viewing Japanese Prints. <https://viewingjapaneseprints.net/texts/shin_hanga/intro_shin.html>

18. <span id="reference-18"></span> Fiorillo, J., 1999. “Sôsaku Hanga (Creative Prints: 創作版画).“ Viewing Japanese Prints. <https://viewingjapaneseprints.net/texts/sosaku_hanga/intro_sosaku.html>

19. <span id="reference-19"></span> Fiorillo, J., 1999. “Aniline Dyes in Meiji *Nishiki-e* Toyohara Kunichika (豊原國周).“ Viewing Japanese Prints. <https://viewingjapaneseprints.net/texts/topics_faq/anilinedyes.html>

20. <span id="reference-20"></span> Smith HD., 2005. “Hokusai and the Blue Revolution in Edo Prints.” In: Carpenter JT, editor. *Hokusai and his age: ukiyo-e painting, printmaking and book illustration in late Edo Japan*. Amsterdam: Hotei; 2005. p. 234–69.

21. <span id="reference-21"></span> Vermeulen, M., Burgio, L., Vandeperre, N. et al., 2020. “Beyond the connoisseurship approach: creating a chronology in Hokusai prints using non-invasive techniques and multivariate data analysis.“ *Heritage Science* 8 62. <https://heritagesciencejournal.springeropen.com/articles/10.1186/s40494-020-00406-y>

22. <span id="reference-22"></span> Harr, Lorraine Ellis. “Haiku Poetry.” *Journal of Aesthetic Education*, vol. 9, no. 3, 1975, pp. 112–19. *JSTOR*, <https://doi.org/10.2307/3331909>. Accessed 6 Sep. 2022.
