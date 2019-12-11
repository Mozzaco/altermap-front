import React from 'react';
import './ConstructionSiteForm.css';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

function ConstructionSiteForm() {
  return (
    <div className="ConstructionSiteForm">
      <Link to="/" onClick={() => { console.log('Set state to close'); }}>
        <Icon className="ConstructionSiteForm__icon" icon={faWindowClose} />
      </Link>
      <div className="ConstructionSiteForm__header">
        <h1 className="ConstructionSiteForm__header-title">Édition chantier</h1>
      </div>
      <div className="ConstructionSiteForm__content">
        <form
          className="ConstructionSiteForm__form"
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Send data to database');
          }}
        >
          <label htmlFor="constructionName">Nom du chantier</label>
          <input type="text" name="constructionName" id="constructionName" />
          <div>
            <input type="submit" />
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConstructionSiteForm;
