import type { Schema, Struct } from '@strapi/strapi';

export interface SharedBenefit extends Struct.ComponentSchema {
  collectionName: 'components_shared_benefits';
  info: {
    displayName: 'List Item';
  };
  attributes: {
    text: Schema.Attribute.String;
  };
}

export interface SharedDetails extends Struct.ComponentSchema {
  collectionName: 'components_shared_details';
  info: {
    displayName: 'details';
  };
  attributes: {
    details: Schema.Attribute.JSON;
  };
}

export interface SharedEmails extends Struct.ComponentSchema {
  collectionName: 'components_shared_emails';
  info: {
    displayName: 'emails';
  };
  attributes: {
    address: Schema.Attribute.Email;
  };
}

export interface SharedHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_slides';
  info: {
    displayName: 'hero-slide';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedLinkItems extends Struct.ComponentSchema {
  collectionName: 'components_shared_link_items';
  info: {
    displayName: 'link-items';
    icon: 'link';
  };
  attributes: {
    text: Schema.Attribute.String;
    visibled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedPhones extends Struct.ComponentSchema {
  collectionName: 'components_shared_phones';
  info: {
    displayName: 'phones';
  };
  attributes: {
    phones: Schema.Attribute.BigInteger;
  };
}

export interface SharedRequirement extends Struct.ComponentSchema {
  collectionName: 'components_shared_requirements';
  info: {
    displayName: 'requirement';
  };
  attributes: {
    requirements: Schema.Attribute.JSON;
  };
}

export interface SharedSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'social-links';
  };
  attributes: {
    href: Schema.Attribute.Text;
    name: Schema.Attribute.String;
  };
}

export interface SharedValues extends Struct.ComponentSchema {
  collectionName: 'components_shared_values';
  info: {
    displayName: 'values';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.benefit': SharedBenefit;
      'shared.details': SharedDetails;
      'shared.emails': SharedEmails;
      'shared.hero-slide': SharedHeroSlide;
      'shared.link-items': SharedLinkItems;
      'shared.phones': SharedPhones;
      'shared.requirement': SharedRequirement;
      'shared.social-links': SharedSocialLinks;
      'shared.values': SharedValues;
    }
  }
}
